export class AssertionCollector {
  private errors: string[] = [];

  async collect(assertion: () => Promise<void>, errorMessage = "Assertion Error"): Promise<void> {
    try {
      await Promise.race([
        assertion(),
        new Promise((resolve, reject) =>
          setTimeout(() => reject(new Error(errorMessage)), 5000),
        ),
      ]);
    } catch (error) {
      const caughtErrorMsg = (error as Error).message;
      this.errors.push(`\n${errorMessage}: ${caughtErrorMsg},`);
    };
  }

  throwIfAny(): void {
    if (this.errors.length > 0) {
      throw new Error(this.errors.join("\n"));
    }
  }
}