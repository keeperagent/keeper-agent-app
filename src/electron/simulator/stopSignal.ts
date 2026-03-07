// @StopSignal class used to notify a Thread should stop

export class StopSignal {
  private mapThreadShouldStop: { [profileKey: string]: boolean };

  constructor() {
    this.mapThreadShouldStop = {};
  }

  saveStopSignal(profileKey: string) {
    this.mapThreadShouldStop[profileKey] = true;
  }

  removeStopSignal(profileKey: string) {
    delete this.mapThreadShouldStop[profileKey];
  }

  removeAllStopSignal() {
    this.mapThreadShouldStop = {};
  }

  shouldStop(profileKey: string): boolean {
    return Boolean(this.mapThreadShouldStop[profileKey]);
  }
}
