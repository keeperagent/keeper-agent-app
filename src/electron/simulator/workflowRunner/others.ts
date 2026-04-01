import { Page } from "playwright-core";
import { executeInSandbox } from "@/electron/simulator/sandbox";
import _ from "lodash";
import {
  updateVariable,
  processSkipSetting,
  getActualValue,
  executeCodeWithVariable,
} from "@/electron/simulator/util";
import {
  MESSAGE_TURN_OFF_PROFILE,
  MESSAGE_CONDITION_RETURN_FALSE,
} from "@/electron/simulator/constant";
import {
  IFlowProfile,
  IWorkflowVariable,
  ISetAttributeNodeConfig,
  ISaveWalletNodeConfig,
  IWallet,
  ISaveResourceNodeConfig,
  IResource,
  ICheckConditionNodeConfig,
  IGetRandomValueNodeConfig,
  IRandomOnOffNodeConfig,
  ICalculateNodeConfig,
  IUpdateProfileNodeConfig,
  ISaveLogNodeConfig,
  AppLogType,
  IExecuteCodeNodeConfig,
  IOnOffProfileNodeConfig,
  ICheckResourceNodeConfig,
  ISelectWalletNodeConfig,
  IHttpRequestNodeConfig,
  IKeyValue,
} from "@/electron/type";
import {
  COMPARISION_EXPRESSION,
  RANDOM_OPTION,
  WORKFLOW_TYPE,
  SET_ATTRIBUTE_MODE,
  MATH_EQUATION,
  PROFILE_STATUS,
  WALLET_VARIABLE,
  BOOLEAN_RESULT,
  IS_WALLET_EXIST,
  IS_RESOURCE_EXIST,
  NUMBER_OF_COLUMN,
} from "@/electron/constant";
import { resourceGroupDB } from "@/electron/database/resourceGroup";
import { walletDB } from "@/electron/database/wallet";
import { appLogDB } from "@/electron/database/appLog";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { resourceDB } from "@/electron/database/resource";
import { nodeSecretDB } from "@/electron/database/nodeSecret";
import { encryptWallet } from "@/electron/service/wallet";
import { decryptResource, encryptResource } from "@/electron/service/resource";
import { logEveryWhere } from "@/electron/service/util";
import { RandomOnOff } from "@/electron/simulator/category/randomOnOff";
import { ThreadManager } from "./threadManager";
import type { NodeHandler } from "./index";
import { WorkflowRunnerArgs } from "./index";
import { HttpRequest } from "@/electron/simulator/category/httpRequest";
import { getResourceColumn } from "@/service/tableView";

export class OtherWorkflow {
  threadManager: ThreadManager;
  randomOnOff: RandomOnOff;

  constructor({ threadManager, randomOnOff }: WorkflowRunnerArgs) {
    this.threadManager = threadManager;
    this.randomOnOff = randomOnOff;
  }

  checkCondition = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      const script = async (
        page: Page,
        config: ICheckConditionNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        const { profile = {} } = flowProfile;
        if (typeof profile?.id !== "number") {
          throw Error("invalid profile");
        }

        let { leftSide = "", condition, rightSide = "" } = config;
        if (!condition) {
          throw Error("missing config condition");
        }

        leftSide = getActualValue(leftSide, listVariable);
        rightSide = getActualValue(rightSide, listVariable);

        let isConditionSuccess = false;
        if (condition === COMPARISION_EXPRESSION.EQUAL) {
          if (leftSide === rightSide) {
            isConditionSuccess = true;
          }
        } else if (condition === COMPARISION_EXPRESSION.LARGER) {
          if (Number(leftSide) > Number(rightSide)) {
            isConditionSuccess = true;
          }
        } else if (condition === COMPARISION_EXPRESSION.SMALLER) {
          if (Number(leftSide) < Number(rightSide)) {
            isConditionSuccess = true;
          }
        } else if (condition === COMPARISION_EXPRESSION.NOT_EQUAL) {
          if (leftSide !== rightSide) {
            isConditionSuccess = true;
          }
        }

        if (!isConditionSuccess) {
          throw Error(MESSAGE_CONDITION_RETURN_FALSE);
        }

        return { ...flowProfile, isConditionSuccess };
      };

      return this.threadManager.runNormalTask<ICheckConditionNodeConfig>({
        flowProfile,
        taskFn: script,
        timeout: 0,
        taskName: "checkCondition",
        withoutBrowser: true,
      });
    } catch (err: any) {
      logEveryWhere({
        message: `checkCondition() error: ${err?.message}`,
        campaignId: flowProfile.campaignConfig?.campaignId,
        workflowId: flowProfile.campaignConfig?.workflowId,
      });
      return [flowProfile, err];
    }
  };

  onOffProfile = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      const script = async (
        page: Page,
        config: IOnOffProfileNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        const { profile = {} } = flowProfile;
        if (
          typeof profile?.campaignId !== "number" &&
          typeof profile?.id !== "number"
        ) {
          throw Error("invalid profile");
        }

        let {
          leftSide = "",
          condition,
          rightSide = "",
          profileStatus,
        } = config;
        if (!condition) {
          throw Error("missing config condition");
        }

        leftSide = getActualValue(leftSide, listVariable);
        rightSide = getActualValue(rightSide, listVariable);

        let isConditionSuccess = false;
        if (condition === COMPARISION_EXPRESSION.EQUAL) {
          if (leftSide === rightSide) {
            isConditionSuccess = true;
          }
        } else if (condition === COMPARISION_EXPRESSION.LARGER) {
          if (Number(leftSide) > Number(rightSide)) {
            isConditionSuccess = true;
          }
        } else if (condition === COMPARISION_EXPRESSION.SMALLER) {
          if (Number(leftSide) < Number(rightSide)) {
            isConditionSuccess = true;
          }
        } else if (condition === COMPARISION_EXPRESSION.NOT_EQUAL) {
          if (leftSide !== rightSide) {
            isConditionSuccess = true;
          }
        }

        if (isConditionSuccess) {
          const [, err] = await campaignProfileDB.updateCampaignProfile({
            id: profile?.id,
            campaignId: profile?.campaignId,
            isActive: profileStatus === PROFILE_STATUS.ACTIVE ? true : false,
          });
          if (err) {
            throw err;
          }
        }

        return flowProfile;
      };

      return this.threadManager.runNormalTask<IOnOffProfileNodeConfig>({
        flowProfile,
        taskFn: script,
        timeout:
          ((flowProfile?.config as IOnOffProfileNodeConfig)?.timeout || 0) *
          1000,
        taskName: "onOffProfile",
        withoutBrowser: true,
      });
    } catch (err: any) {
      logEveryWhere({
        message: `onOffProfile() error: ${err?.message}`,
        campaignId: flowProfile.campaignConfig?.campaignId,
        workflowId: flowProfile.campaignConfig?.workflowId,
      });
      return [flowProfile, err];
    }
  };

  saveWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      const script = async (
        page: Page,
        config: ISaveWalletNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        if (!config?.walletGroup) {
          throw Error("walletGroup can not be empty");
        }

        const address = getActualValue(config?.address || "", listVariable);
        const phrase = getActualValue(config?.phrase || "", listVariable);
        const privateKey = getActualValue(
          config?.privateKey || "",
          listVariable,
        );

        let encryptKey = "";
        if (flowProfile?.nodeID && flowProfile?.campaignConfig?.workflowId) {
          encryptKey =
            (await nodeSecretDB.getSecretKey(
              flowProfile.campaignConfig.workflowId,
              flowProfile.nodeID,
            )) || "";
        }

        let newWallet: IWallet = {
          address,
          phrase,
          privateKey,
          isEncrypted: Boolean(encryptKey),
          groupId: config?.walletGroup!,
        };
        newWallet = encryptWallet(newWallet, encryptKey);

        const [, err1] = await walletDB.createWallet(newWallet);
        if (err1) {
          throw err1;
        }

        return flowProfile;
      };

      return this.threadManager.runNormalTask<ISaveWalletNodeConfig>({
        flowProfile,
        taskFn: script,
        timeout: 0,
        taskName: "saveWallet",
        withoutBrowser: true,
      });
    } catch (err: any) {
      logEveryWhere({
        message: `saveWallet() error: ${err?.message}`,
        campaignId: flowProfile.campaignConfig?.campaignId,
        workflowId: flowProfile.campaignConfig?.workflowId,
      });
      return [flowProfile, err];
    }
  };

  selectWallet = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      const script = async (
        page: Page,
        config: ISelectWalletNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        let encryptKey = "";
        if (flowProfile?.nodeID && flowProfile?.campaignConfig?.workflowId) {
          encryptKey =
            (await nodeSecretDB.getSecretKey(
              flowProfile.campaignConfig.workflowId,
              flowProfile.nodeID,
            )) || "";
        }

        const compareValue = getActualValue(
          config?.compareValue || "",
          listVariable,
        );
        if (!config?.walletGroupId) {
          throw Error("walletGroupId can not be empty");
        }

        let wallet: IWallet = { groupId: config?.walletGroupId };
        if (config?.fieldName === WALLET_VARIABLE.WALLET_ADDRESS) {
          wallet = { ...wallet, address: compareValue };
        } else if (config?.fieldName === WALLET_VARIABLE.WALLET_PHRASE) {
          wallet = { ...wallet, phrase: compareValue };
        } else if (config?.fieldName === WALLET_VARIABLE.WALLET_PRIVATE_KEY) {
          wallet = { ...wallet, privateKey: compareValue };
        }
        const [foundwallet, err1] = await walletDB.findWallet(
          wallet,
          encryptKey,
        );
        if (err1) {
          throw err1;
        }

        let newListVariable = updateVariable(listVariable, {
          variable: IS_WALLET_EXIST,
          value: foundwallet ? BOOLEAN_RESULT.TRUE : BOOLEAN_RESULT.FALSE,
        });
        if (foundwallet) {
          newListVariable = updateVariable(listVariable, {
            variable: WALLET_VARIABLE.WALLET_ADDRESS,
            value: foundwallet?.address,
          });
          newListVariable = updateVariable(listVariable, {
            variable: WALLET_VARIABLE.WALLET_PHRASE,
            value: foundwallet?.phrase,
          });
          newListVariable = updateVariable(listVariable, {
            variable: WALLET_VARIABLE.WALLET_PRIVATE_KEY,
            value: foundwallet?.privateKey,
          });
        }

        const updatedProfile: IFlowProfile = {
          ...flowProfile,
          listVariable: newListVariable,
        };

        return updatedProfile;
      };

      return this.threadManager.runNormalTask<ISelectWalletNodeConfig>({
        flowProfile,
        taskFn: script,
        timeout:
          ((flowProfile?.config as ISelectWalletNodeConfig)?.timeout || 0) *
          1000,
        taskName: "selectWallet",
        withoutBrowser: true,
      });
    } catch (err: any) {
      logEveryWhere({
        message: `selectWallet() error: ${err?.message}`,
        campaignId: flowProfile.campaignConfig?.campaignId,
        workflowId: flowProfile.campaignConfig?.workflowId,
      });
      return [flowProfile, err];
    }
  };

  saveResource = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      const script = async (
        page: Page,
        config: ISaveResourceNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        if (!config?.resourceGroup) {
          throw Error("resourceGroup can not be empty");
        }

        let encryptKey = "";
        if (flowProfile?.nodeID && flowProfile?.campaignConfig?.workflowId) {
          encryptKey =
            (await nodeSecretDB.getSecretKey(
              flowProfile.campaignConfig.workflowId,
              flowProfile.nodeID,
            )) || "";
        }

        const [resourceGroup, err] = await resourceGroupDB.getOneResourceGroup(
          config?.resourceGroup!,
        );
        if (err || !resourceGroup) {
          throw Error("can not find resource group");
        }

        if (!config?.isInsertMultipleResource) {
          const colValues: any = {};
          for (let i = 1; i <= NUMBER_OF_COLUMN; i++) {
            colValues[`col${i}`] = getActualValue(
              (config as any)?.[`col${i}`] || "",
              listVariable,
            );
          }

          let newResource: IResource = {
            ...colValues,
            isEncrypted: Boolean(encryptKey),
            groupId: config?.resourceGroup!,
          };

          newResource = encryptResource(newResource, resourceGroup, encryptKey);
          const [, err] = await resourceDB.createResource(newResource);
          if (err) {
            throw err;
          }
          return flowProfile;
        } else {
          const batchValue = JSON.parse(
            getActualValue(config?.batchValue || "", listVariable) || "[]",
          );
          const resources: IResource[] = [];
          batchValue?.forEach((item: any) => {
            let resource: any = {
              isEncrypted: Boolean(encryptKey),
              groupId: config?.resourceGroup!,
            };
            if (_.isEmpty(item)) {
              return;
            }

            const mapVariableToColumn: any = {};
            for (let i = 1; i <= NUMBER_OF_COLUMN; i++) {
              mapVariableToColumn[
                (resourceGroup as any)[`col${i}Variable`] || ""
              ] = `col${i}`;
            }

            Object.keys(item).forEach((key) => {
              if (!key) {
                return;
              }
              const colName = mapVariableToColumn[key];
              if (!colName) {
                return;
              }
              resource[colName] = getActualValue(item[key] || "", listVariable);
            });

            resource = encryptResource(resource, resourceGroup, encryptKey);
            resources.push(resource);
          });

          const err = await resourceDB.createBulkResource(resources);
          if (err) {
            throw err;
          }

          return flowProfile;
        }
      };

      return this.threadManager.runNormalTask<ISaveResourceNodeConfig>({
        flowProfile,
        taskFn: script,
        timeout: 0,
        taskName: "saveResource",
        withoutBrowser: true,
      });
    } catch (err: any) {
      logEveryWhere({
        message: `saveResource() error: ${err?.message}`,
        campaignId: flowProfile.campaignConfig?.campaignId,
        workflowId: flowProfile.campaignConfig?.workflowId,
      });
      return [flowProfile, err];
    }
  };

  selectResource = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      const script = async (
        page: Page,
        config: ICheckResourceNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        let encryptKey = "";
        if (flowProfile?.nodeID && flowProfile?.campaignConfig?.workflowId) {
          encryptKey =
            (await nodeSecretDB.getSecretKey(
              flowProfile.campaignConfig.workflowId,
              flowProfile.nodeID,
            )) || "";
        }

        const compareValue = getActualValue(
          config?.compareValue || "",
          listVariable,
        );
        if (!config?.resourceGroupId) {
          throw Error("resourceGroupId can not be empty");
        }

        let resource: IResource = { groupId: config?.resourceGroupId };
        resource = {
          ...resource,
          [config?.fieldName || ""]: compareValue,
        };

        let [foundResource, err1] = await resourceDB.findResource(
          resource,
          config?.fieldName || "",
          encryptKey,
        );
        if (err1) {
          throw err1;
        }

        const newListVariable = updateVariable(listVariable, {
          variable: IS_RESOURCE_EXIST,
          value: foundResource ? BOOLEAN_RESULT.TRUE : BOOLEAN_RESULT.FALSE,
        });

        if (foundResource) {
          if (encryptKey) {
            foundResource = decryptResource(foundResource, encryptKey);
          }

          const [resourceGroup, err] =
            await resourceGroupDB.getOneResourceGroup(foundResource?.groupId!);
          if (err) {
            throw err;
          }
          if (!resourceGroup) {
            throw Error("can not find resource group");
          }

          const listColumn = getResourceColumn(resourceGroup);
          for (const column of listColumn) {
            const columnValue = (foundResource as any)[column?.dataIndex!];
            newListVariable.push({
              variable: column?.variable!,
              value: columnValue,
            });
          }
        }

        const updatedProfile: IFlowProfile = {
          ...flowProfile,
          listVariable: newListVariable,
        };

        return updatedProfile;
      };

      return this.threadManager.runNormalTask<ICheckResourceNodeConfig>({
        flowProfile,
        taskFn: script,
        timeout:
          ((flowProfile?.config as ICheckResourceNodeConfig)?.timeout || 0) *
          1000,
        taskName: "selectResource",
        withoutBrowser: true,
      });
    } catch (err: any) {
      logEveryWhere({
        message: `selectResource() error: ${err?.message}`,
        campaignId: flowProfile.campaignConfig?.campaignId,
        workflowId: flowProfile.campaignConfig?.workflowId,
      });
      return [flowProfile, err];
    }
  };

  saveLog = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      const script = async (
        page: Page,
        config: ISaveLogNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        const content = getActualValue(config?.content || "", listVariable);
        const [, err1] = await appLogDB.createAppLog({
          logType: AppLogType.WORKFLOW,
          message: content,
          workflowId: flowProfile?.campaignConfig?.workflowId,
          campaignId: flowProfile?.campaignConfig?.campaignId,
        });
        if (err1) {
          throw err1;
        }
        return flowProfile;
      };

      return this.threadManager.runNormalTask<ISaveLogNodeConfig>({
        flowProfile,
        taskFn: script,
        timeout:
          ((flowProfile?.config as ISaveLogNodeConfig)?.timeout || 0) * 1000,
        taskName: "saveLog",
        withoutBrowser: true,
      });
    } catch (err: any) {
      logEveryWhere({
        message: `saveLog() error: ${err?.message}`,
        campaignId: flowProfile.campaignConfig?.campaignId,
        workflowId: flowProfile.campaignConfig?.workflowId,
      });
      return [flowProfile, err];
    }
  };

  httpRequest = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const timeout =
      ((flowProfile?.config as IHttpRequestNodeConfig)?.timeout || 0) * 1000;

    try {
      const script = async (
        page: Page,
        config: IHttpRequestNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        const extractResponseCode = getActualValue(
          config?.extractResponseCode || "",
          listVariable,
        );
        const requestBody = getActualValue(
          config?.requestBody || "",
          listVariable,
        );
        const url = getActualValue(config?.url || "", listVariable);
        const headers =
          config?.headers?.map((header: IKeyValue) => ({
            key: header.key,
            value: getActualValue(header?.value, listVariable),
          })) || [];
        const params =
          config?.params?.map((param: IKeyValue) => ({
            key: param.key,
            value: getActualValue(param?.value, listVariable),
          })) || [];
        const httpRequestInstance = new HttpRequest();
        let [result] = await httpRequestInstance.callAPI(
          config?.method!,
          url,
          requestBody,
          headers,
          params,
          timeout,
        );

        let newListVariable = updateVariable(listVariable, {
          variable: config?.variable!,
          value: result,
        });

        if (extractResponseCode) {
          let err = null;
          [result, err] = await executeCodeWithVariable(
            extractResponseCode,
            newListVariable,
            timeout,
          );
          if (err) {
            throw err;
          }

          // update variable again
          newListVariable = updateVariable(listVariable, {
            variable: config?.variable!,
            value: result,
          });
        }

        const updatedProfile: IFlowProfile = {
          ...flowProfile,
          listVariable: newListVariable,
        };
        return updatedProfile;
      };

      return this.threadManager.runNormalTask<IExecuteCodeNodeConfig>({
        flowProfile,
        taskFn: script,
        taskName: "httpRequest",
        withoutBrowser: true,
        timeout,
      });
    } catch (err: any) {
      logEveryWhere({
        message: `httpRequest() error: ${err?.message}`,
        campaignId: flowProfile.campaignConfig?.campaignId,
        workflowId: flowProfile.campaignConfig?.workflowId,
      });
      return [flowProfile, err];
    }
  };

  executeCode = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      const timeout =
        ((flowProfile?.config as IExecuteCodeNodeConfig)?.timeout || 0) * 1000;

      const script = async (
        page: Page,
        config: IExecuteCodeNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        const code = config?.code || "";
        let result: any = "";

        if (config?.useBrowser) {
          let declareVariableCode = "";
          listVariable.forEach((variable: IWorkflowVariable) => {
            if (variable?.variable) {
              let value: any = "";

              try {
                value = JSON.parse(variable?.value);
              } catch {
                value = variable?.value;
              }

              if (typeof value === "object") {
                value = JSON.stringify(value);
              } else if (typeof value === "string") {
                value = `"${value}"`;
              }

              declareVariableCode += `let ${variable?.variable} = ${value};\n`;
            }
          });
          const codeFunc = `(function() { ${declareVariableCode} ${code} })()`;

          result = await page.evaluate((codeFunc) => {
            const func = new Function(codeFunc);
            return func();
          }, codeFunc);
        } else {
          const variables = listVariable
            .filter((v) => v?.variable)
            .map((v) => {
              let value: any = "";
              try {
                value = JSON.parse(v?.value);
              } catch {
                value = v?.value;
              }
              return { name: v.variable!, value };
            });

          const [sandboxResult, sandboxErr] = await executeInSandbox(
            code,
            variables,
            {
              timeout,
            },
          );
          if (sandboxErr) {
            throw sandboxErr;
          }
          result = sandboxResult;
        }

        if (typeof result === "object") {
          result = JSON.stringify(result);
        } else if (result === "undefined" || result === "null") {
          result = String(null);
        }

        const newListVariable = updateVariable(listVariable, {
          variable: config?.variable!,
          value: result,
        });

        const updatedProfile: IFlowProfile = {
          ...flowProfile,
          listVariable: newListVariable,
        };

        return updatedProfile;
      };

      return this.threadManager.runNormalTask<IExecuteCodeNodeConfig>({
        flowProfile,
        taskFn: script,
        timeout,
        taskName: "executeCode",
        withoutBrowser: !(flowProfile?.config as IExecuteCodeNodeConfig)
          ?.useBrowser,
      });
    } catch (err: any) {
      logEveryWhere({
        message: `executeCode() error: ${err?.message}`,
        campaignId: flowProfile.campaignConfig?.campaignId,
        workflowId: flowProfile.campaignConfig?.workflowId,
      });
      return [flowProfile, err];
    }
  };

  updateCampaignProfile = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    try {
      const script = async (
        page: Page,
        config: IUpdateProfileNodeConfig,
        listVariable: IWorkflowVariable[],
      ): Promise<IFlowProfile> => {
        if (processSkipSetting(config, listVariable)) {
          return flowProfile;
        }

        const { profile = {} } = flowProfile;
        if (
          typeof profile?.campaignId !== "number" ||
          typeof profile?.id !== "number"
        ) {
          throw Error("invalid profile");
        }
        if (!config?.columnVariable) {
          throw Error("missing column");
        }

        const columnValue = getActualValue(
          config?.columnValue || "",
          listVariable,
        );
        const [, err1] = await campaignProfileDB.updateCampaignProfile({
          campaignId: profile?.campaignId,
          id: profile?.id,
          [config?.columnVariable]: columnValue,
        });

        const newListVariable = updateVariable(listVariable, {
          variable: config?.columnVariableName!,
          value: columnValue,
        });
        const updatedFlowProfile = {
          ...flowProfile,
          profile: {
            ...profile,
            [config?.columnVariable]: columnValue,
          },
          listVariable: newListVariable,
        };
        if (err1) {
          throw err1;
        }
        return updatedFlowProfile;
      };

      return this.threadManager.runNormalTask<IUpdateProfileNodeConfig>({
        flowProfile,
        taskFn: script,
        timeout:
          ((flowProfile?.config as IUpdateProfileNodeConfig)?.timeout || 0) *
          1000,
        taskName: "updateCampaignProfile",
        withoutBrowser: true,
      });
    } catch (err: any) {
      logEveryWhere({
        message: `updateCampaignProfile() error: ${err?.message}`,
        campaignId: flowProfile.campaignConfig?.campaignId,
        workflowId: flowProfile.campaignConfig?.workflowId,
      });
      return [flowProfile, err];
    }
  };

  setAttribute = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ISetAttributeNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      let newListVariable: IWorkflowVariable[] = [];
      let value = null;

      if (config?.mode === SET_ATTRIBUTE_MODE.BASIC) {
        value = getActualValue(config?.value || "", listVariable);
      } else if (config?.mode === SET_ATTRIBUTE_MODE.ADVANCED) {
        const { listValue = [] } = config;

        const comparedValue = getActualValue(
          config?.comparedValue || "",
          listVariable,
        );

        for (let i = 0; i < listValue?.length; i++) {
          const targetValue = listValue[i]?.targetValue;
          const valueItem = getActualValue(listValue[i]?.value, listVariable);

          if (comparedValue === targetValue) {
            value = valueItem;
          }
        }
      }

      newListVariable = updateVariable(listVariable, {
        variable: config?.variable!,
        value,
      });

      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<ISetAttributeNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout: 0,
      taskName: "setAttribute",
      withoutBrowser: true,
    });
  };

  getRandomValue = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IGetRandomValueNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      const {
        min = 0,
        max = 0,
        type,
        variable = "",
        listValue = [],
        decimal = 0,
      } = config;

      let value: any = null;
      if (type === RANDOM_OPTION.RANDOM_NUMBER) {
        value = Math.random() * (max - min) + min;
        const randomFactor = Math.pow(10, decimal);
        value = Math.round(value * randomFactor) / randomFactor;
      } else if (type === RANDOM_OPTION.RANDOM_VALUE) {
        const randomIndex = Math.round(Math.random() * (listValue?.length - 1));
        value = listValue[randomIndex];
      }

      const newListVariable = updateVariable(listVariable, {
        variable,
        value,
      });

      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };
      return updatedProfile;
    };

    return this.threadManager.runNormalTask<IGetRandomValueNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout:
        ((flowProfile?.config as IGetRandomValueNodeConfig)?.timeout || 0) *
        1000,
      taskName: "getRandomValue",
      withoutBrowser: true,
    });
  };

  calculate = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: ICalculateNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      const {
        leftSideEquation = "",
        equation,
        rightSideEquation = "",
      } = config;
      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      let leftSideValue: any = getActualValue(leftSideEquation, listVariable);
      leftSideValue = Number(leftSideValue);

      let rightSideValue: any = getActualValue(rightSideEquation, listVariable);
      rightSideValue = Number(rightSideValue);

      let result: any;
      if (equation === MATH_EQUATION.ADD) {
        result = leftSideValue + rightSideValue;
      } else if (equation === MATH_EQUATION.SUBSTRACT) {
        result = leftSideValue - rightSideValue;
      } else if (equation === MATH_EQUATION.MULTIPLY) {
        result = leftSideValue * rightSideValue;
      } else if (equation === MATH_EQUATION.DEVIDE) {
        result = leftSideValue / rightSideValue;
      }

      if (isNaN(result) || !isFinite(result)) {
        throw Error("can not calculate result");
      }

      if (config?.decimal !== undefined) {
        result = (result as number)?.toFixed(config?.decimal);
      }

      const newListVariable = updateVariable(listVariable, {
        variable: config?.variable!,
        value: result?.toString(),
      });

      const updatedProfile: IFlowProfile = {
        ...flowProfile,
        listVariable: newListVariable,
      };

      return updatedProfile;
    };

    return this.threadManager.runNormalTask<ICalculateNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout: 0,
      taskName: "calculate",
      withoutBrowser: true,
    });
  };

  getRandomOnOff = async (
    flowProfile: IFlowProfile,
  ): Promise<[IFlowProfile | null, Error | null]> => {
    const script = async (
      page: Page,
      config: IRandomOnOffNodeConfig,
      listVariable: IWorkflowVariable[],
    ): Promise<IFlowProfile> => {
      const { campaignConfig, profile } = flowProfile;
      const { totalProfileInWorkflow = 0 } = campaignConfig || {};
      const { truePercentage = 0 } = config;
      let count = 0;
      if (profile?.campaignId) {
        const [, totalUnFinishProfile, err] =
          await campaignProfileDB.getCampaignProfileStatus(
            profile?.campaignId!,
          );
        if (err) {
          throw err;
        }
        count = totalUnFinishProfile;
      } else {
        count = totalProfileInWorkflow;
      }

      if (processSkipSetting(config, listVariable)) {
        return flowProfile;
      }

      this.randomOnOff.init(count, truePercentage);
      const flag = await this.randomOnOff.getNextValue();
      if (!flag) {
        throw Error(MESSAGE_TURN_OFF_PROFILE);
      }
      return flowProfile;
    };

    return this.threadManager.runNormalTask<IRandomOnOffNodeConfig>({
      flowProfile,
      taskFn: script,
      timeout: 0,
      taskName: "getRandomOnOff",
      withoutBrowser: true,
    });
  };
}

export const registerOtherHandlers = (
  handlers: Map<string, NodeHandler>,
  args: WorkflowRunnerArgs,
) => {
  const s = new OtherWorkflow(args);
  handlers.set(WORKFLOW_TYPE.CHECK_CONDITION, s.checkCondition);
  handlers.set(WORKFLOW_TYPE.SET_ATTRIBUTE, s.setAttribute);
  handlers.set(WORKFLOW_TYPE.GET_RANDOM_VALUE, s.getRandomValue);
  handlers.set(WORKFLOW_TYPE.RANDOM_ON_OFF, s.getRandomOnOff);
  handlers.set(WORKFLOW_TYPE.CALCULATE, s.calculate);
  handlers.set(WORKFLOW_TYPE.SAVE_WALLET, s.saveWallet);
  handlers.set(WORKFLOW_TYPE.SELECT_WALLET, s.selectWallet);
  handlers.set(WORKFLOW_TYPE.SAVE_RESOURCE, s.saveResource);
  handlers.set(WORKFLOW_TYPE.CHECK_RESOURCE, s.selectResource);
  handlers.set(WORKFLOW_TYPE.UPDATE_PROFILE, s.updateCampaignProfile);
  handlers.set(WORKFLOW_TYPE.ON_OFF_PROFILE, s.onOffProfile);
  handlers.set(WORKFLOW_TYPE.SAVE_LOG, s.saveLog);
  handlers.set(WORKFLOW_TYPE.HTTP_REQUEST, s.httpRequest);
  handlers.set(WORKFLOW_TYPE.EXECUTE_CODE, s.executeCode);
};
