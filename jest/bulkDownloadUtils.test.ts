import { Work } from "@mui/icons-material";
import {
  parseIsUserOwnerOfAllObjects,
  parseRailsValidationInfo,
  parseValidationInfo,
} from "../app/assets/src/components/views/samples/SamplesView/components/BulkDownloadModal/utils.ts";
import { WorkflowRunStatusType } from "../app/assets/src/components/views/samples/SamplesView/components/BulkDownloadModal/types.ts";

const railsValidationInfo = {
  validIds: [123, 456],
  invalidSampleNames: ["sample3", "sample4"],
  error: null,
};

const nextgenValidationInfo = {
  workflowRuns: [
    {
      id: "123",
      ownerUserId: 412,
      status: WorkflowRunStatusType.SUCCEEDED,
    },
    {
      id: "456",
      ownerUserId: 263,
      status: WorkflowRunStatusType.SUCCEEDED,
    },
    {
      id: "789",
      ownerUserId: 263,
      status: WorkflowRunStatusType.FAILED,
    },
    {
      id: "124",
      ownerUserId: 263,
      status: WorkflowRunStatusType.SUCCEEDED_WITH_ISSUE,
    },
  ],
  error: undefined,
};

const runsOwnedByUser263 = {
  ...nextgenValidationInfo,
  workflowRuns: nextgenValidationInfo.workflowRuns.filter(
    run => run.ownerUserId === 263,
  ),
};

const selectedObjects = [
  {
    id: 123,
    sample: {
      name: "sample1",
    },
  },
  {
    id: 456,
    sample: {
      name: "sample2",
    },
  },
  {
    id: 789,
    sample: {
      name: "sample3",
    },
  },
  {
    id: 124,
    sample: {
      name: "sample4",
    },
  },
];

const expected = {
  validIds: ["123", "456"],
  invalidSampleNames: ["sample3", "sample4"],
  validationError: null,
};

const ERROR_MESSAGE = "Error: something went wrong";

const expectedWithError = {
  validIds: [],
  invalidSampleNames: [],
  validationError: ERROR_MESSAGE,
};

describe("Bulk Download workflow validation", () => {
  test("rails parser works as expected", () => {
    const output = parseRailsValidationInfo(railsValidationInfo);
    expect(output).toStrictEqual(expected);
  });

  test("rails parser works as expected with error", () => {
    const output = parseRailsValidationInfo({
      validIds: [],
      invalidSampleNames: [],
      error: ERROR_MESSAGE,
    });
    expect(output).toStrictEqual(expectedWithError);
  });

  test("nextgen parser works as expected", () => {
    const output = parseValidationInfo(nextgenValidationInfo, selectedObjects);
    expect(output).toStrictEqual(expected);
  });

  test("nextgen parser works as expected with error", () => {
    const output = parseValidationInfo(
      { workflowRuns: undefined, error: ERROR_MESSAGE },
      selectedObjects,
    );
    expect(output).toStrictEqual(expectedWithError);
  });
});

describe("isUserOwnerOfAllRuns", () => {
  test("nextgen parser returns true if user owns all workflow runs", () => {
    const CURRENT_USER_ID = 263;
    const output = parseIsUserOwnerOfAllObjects(runsOwnedByUser263, CURRENT_USER_ID);
    expect(output).toBe(true);
  });

  test("nextgen parser returns false if user does not own all workflow runs", () => {
    const CURRENT_USER_ID = 263;
    const output = parseIsUserOwnerOfAllObjects(nextgenValidationInfo, CURRENT_USER_ID);
    expect(output).toBe(false);
  });
});
