export interface ProgressController {
  start(): void;
  done(): void;
}

/**
 * 前台请求引用计数。计数归零才调用 `done()`。
 */
export class ProgressCounter {
  private count = 0;

  constructor(private readonly controller: ProgressController) {}

  get pending(): number {
    return this.count;
  }

  start(): void {
    this.count += 1;
    if (this.count === 1) {
      this.controller.start();
    }
  }

  done(): void {
    if (this.count === 0) {
      return;
    }
    this.count -= 1;
    if (this.count === 0) {
      this.controller.done();
    }
  }

  reset(): void {
    this.count = 0;
    this.controller.done();
  }
}
