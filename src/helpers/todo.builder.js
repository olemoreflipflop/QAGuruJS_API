import { faker } from '@faker-js/faker';

export class TodoBuilder {
  addTitle() {
    this.title = faker.lorem.word({ length: { min: 15, max: 25 } });
    return this;
  }

  addDescription(length = 100) {
    this.description = faker.string.alpha({ length });
    return this;
  }

  addDoneStatus(doneStatus = false) {
    this.doneStatus = doneStatus;
    return this;
  }

  generate() {
    const copy = structuredClone({
      title: this.title,
      description: this.description,
      doneStatus: this.doneStatus,
    });
    return copy;
  }
}
