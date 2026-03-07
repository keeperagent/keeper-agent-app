import AsyncLock from "async-lock";

export class RandomOnOff {
  private listValue: boolean[];
  private currentIndex: number;
  private lock: AsyncLock;
  private lockKey: string;

  constructor() {
    this.listValue = [];
    this.currentIndex = 0;
    this.lock = new AsyncLock();
    this.lockKey = "RandomOnOff";
  }

  init = (length: number, percentage: number) => {
    if (length === 0 || this.listValue.length > 0) {
      return;
    }

    const array = [];
    const trueCount = Math.floor((length * percentage) / 100);

    // Fill the array with `true` values
    for (let i = 0; i < trueCount; i++) {
      array.push(true);
    }

    // Fill the remaining slots with `false` values
    for (let i = trueCount; i < length; i++) {
      array.push(false);
    }

    // Shuffle the array to randomize the order
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    this.listValue = array;
  };

  reset = () => {
    this.listValue = [];
    this.currentIndex = 0;
  };

  getNextValue = async (): Promise<boolean> => {
    let flag = false;

    await this.lock.acquire(this.lockKey, () => {
      const index = this.currentIndex;
      const maxIndex = this.listValue.length - 1;
      if (maxIndex < 0) {
        return false;
      }

      let newIndex = this.currentIndex;
      newIndex += 1;
      if (newIndex > maxIndex) {
        newIndex = 0;
      }
      this.currentIndex = newIndex;
      flag = this.listValue[index];
    });

    return flag;
  };
}
