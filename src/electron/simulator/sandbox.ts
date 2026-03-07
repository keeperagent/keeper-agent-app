import { getQuickJS, QuickJSWASMModule } from "quickjs-emscripten";

let quickJSReady: Promise<QuickJSWASMModule> | null = null;

const getRuntime = () => {
  if (!quickJSReady) {
    quickJSReady = getQuickJS();
  }
  return quickJSReady;
};

export const executeInSandbox = async (
  code: string,
  variables: { name: string; value: any }[],
  options?: { timeout?: number; memoryMB?: number },
): Promise<[any, Error | null]> => {
  const QuickJS = await getRuntime();
  const runtime = QuickJS.newRuntime();
  runtime.setMemoryLimit((options?.memoryMB || 15) * 1024 * 1024);
  runtime.setMaxStackSize(1024 * 1024);

  let cleanup: (() => void) | null = null;
  if (options?.timeout) {
    const timer = setTimeout(() => {
      runtime.setInterruptHandler(() => true);
    }, options.timeout);
    cleanup = () => clearTimeout(timer);
  }

  const vm = runtime.newContext();

  try {
    for (const variable of variables) {
      const result = vm.evalCode(
        `var ${variable.name} = ${JSON.stringify(variable.value)};`,
      );
      if (result.error) {
        const msg = vm.dump(result.error);
        result.error.dispose();
        throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
      result.value.dispose();
    }

    const result = vm.evalCode(`(function() { ${code} })()`);
    if (result.error) {
      const msg = vm.dump(result.error);
      result.error.dispose();
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }

    const value = vm.dump(result.value);
    result.value.dispose();
    return [value, null];
  } catch (err: any) {
    return [null, err];
  } finally {
    if (cleanup) {
      cleanup();
    }
    vm.dispose();
    runtime.dispose();
  }
};
