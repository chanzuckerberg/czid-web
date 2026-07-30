// Coverage: app/assets/src/components/common/DetailsSidebar/SampleDetailsMode/SampleDetailsMode.tsx
//
// SampleDetailsMode is the Relay-backed sidebar shell: it fetches the metadata
// fields + values, switches between the Metadata/Pipelines/Notes tabs and owns
// the save path (three different mutations, plus error handling). relay-test-utils
// is not installed here, so react-relay is stubbed: the query hooks return
// fixtures selected by operation name and the mutation hooks hand back jest
// spies whose onCompleted/onError callbacks the tests invoke directly. The three
// tab bodies are stubbed so the assertions stay on this component's own logic.
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const mockCommitUpdateMetadata = jest.fn();
const mockCommitUpdateSampleName = jest.fn();
const mockCommitUpdateSampleNotes = jest.fn();
const mockLoadMetadataQuery = jest.fn();
const mockGetAllSampleTypes = jest.fn();
const mockState: {
  metadataFields: unknown;
  sampleMetadata: unknown;
} = { metadataFields: null, sampleMetadata: null };

jest.mock("react-relay", () => {
  const operationName = (op: $TSFixMe) =>
    op?.params?.name || op?.default?.params?.name || "";
  return {
    graphql: () => ({}),
    useLazyLoadQuery: (op: $TSFixMe) =>
      operationName(op).includes("MetadataFieldsQuery")
        ? mockState.metadataFields
        : mockState.sampleMetadata,
    useQueryLoader: () => [null, mockLoadMetadataQuery],
    useMutation: (op: $TSFixMe) => {
      const name = operationName(op);
      if (name.includes("UpdateSampleName")) {
        return [mockCommitUpdateSampleName, false];
      }
      if (name.includes("UpdateSampleNotes")) {
        return [mockCommitUpdateSampleNotes, false];
      }
      return [mockCommitUpdateMetadata, false];
    },
  };
});

jest.mock("~/api", () => ({
  getAllSampleTypes: () => mockGetAllSampleTypes(),
}));

jest.mock("~/api/utils", () => ({
  getCsrfToken: () => "csrf-token",
}));

jest.mock(
  "~/components/common/DetailsSidebar/SampleDetailsMode/components/MetadataTab",
  () => ({
    MetadataTab: ({
      onMetadataChange,
      onMetadataSave,
      metadataErrors,
      sampleTypes,
      nameLocal,
      metadataTypes,
    }: $TSFixMe) => (
      <div data-testid="metadata-tab">
        <span data-testid="name-local">{nameLocal}</span>
        <span data-testid="sample-types-count">{sampleTypes.length}</span>
        <span data-testid="metadata-type-keys">
          {Object.keys(metadataTypes).join(",")}
        </span>
        <span data-testid="metadata-errors">
          {JSON.stringify(metadataErrors)}
        </span>
        <button
          data-testid="change-sample-type"
          onClick={() => onMetadataChange("sample_type", "CSF")}
        />
        <button
          data-testid="save-sample-type"
          onClick={() => onMetadataSave("sample_type", { sample_type: "CSF" })}
        />
        <button
          data-testid="change-and-save"
          onClick={() => onMetadataChange("sample_type", "Serum", true)}
        />
        <button
          data-testid="change-name"
          onClick={() => onMetadataChange("name", "Renamed")}
        />
        <button
          data-testid="save-name"
          onClick={() => onMetadataSave("name", { name: "Renamed" })}
        />
      </div>
    ),
  }),
);

jest.mock(
  "~/components/common/DetailsSidebar/SampleDetailsMode/components/NotesTab",
  () => ({
    NotesTab: ({ onNoteChange, onNoteSave }: $TSFixMe) => (
      <div data-testid="notes-tab">
        <button
          data-testid="change-note"
          onClick={() => onNoteChange("a new note")}
        />
        <button
          data-testid="save-note"
          onClick={() => onNoteSave("a new note")}
        />
      </div>
    ),
  }),
);

jest.mock(
  "~/components/common/DetailsSidebar/SampleDetailsMode/components/PipelineTab",
  () => ({
    PipelineTab: ({ sampleId, currentWorkflowTab }: $TSFixMe) => (
      <div data-testid="pipeline-tab">
        {`pipeline:${sampleId}:${currentWorkflowTab || "none"}`}
      </div>
    ),
  }),
);

jest.mock(
  "~/components/views/SampleView/components/ConsensusGenomeView/components/ConsensusGenomeHeader/components/ConsensusGenomeDropdown",
  () => ({
    ConsensusGenomeDropdown: ({
      workflowRuns,
      onConsensusGenomeSelection,
    }: $TSFixMe) => (
      <button
        data-testid="cg-dropdown"
        onClick={() => onConsensusGenomeSelection(workflowRuns[1].id)}
      >
        {`cg-runs:${workflowRuns.length}`}
      </button>
    ),
  }),
);

import { SampleDetailsMode } from "~/components/common/DetailsSidebar/SampleDetailsMode/SampleDetailsMode";
import { WORKFLOW_TABS, WorkflowType } from "~/components/utils/workflows";

const metadataFieldsFixture = {
  MetadataFields: [
    {
      key: "sample_type",
      dataType: "string",
      name: "Sample Type",
      options: null,
      host_genome_ids: [1],
      description: "",
      is_required: 0,
      isBoolean: false,
      group: "Sample",
    },
  ],
};

const sampleMetadataFixture = {
  SampleMetadata: {
    additional_info: {
      name: "Sample A",
      editable: true,
      project_id: 3,
      project_name: "Project P",
      host_genome_taxa_category: "human",
      host_genome_name: "Human",
      upload_date: "2026-07-08T13:45:00Z",
    },
  },
};

const renderSidebar = (props: Record<string, unknown> = {}) =>
  render(<SampleDetailsMode sampleId={42} {...(props as $TSFixMe)} />);

describe("SampleDetailsMode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.metadataFields = metadataFieldsFixture;
    mockState.sampleMetadata = sampleMetadataFixture;
    mockGetAllSampleTypes.mockResolvedValue([
      { id: 1, name: "CSF" },
      { id: 2, name: "Serum" },
    ]);
  });

  it("renders the sample name, the three sidebar tabs and the Metadata tab by default", async () => {
    const { container } = renderSidebar();

    // The sidebar heading is the first child of the root container.
    expect(container.firstElementChild?.firstElementChild?.textContent).toBe(
      "Sample A",
    );
    expect(screen.getByText("Metadata")).toBeTruthy();
    expect(screen.getByText("Pipelines")).toBeTruthy();
    expect(screen.getByText("Notes")).toBeTruthy();
    expect(screen.getByTestId("metadata-tab")).toBeTruthy();
    expect(screen.getByTestId("name-local").textContent).toBe("Sample A");
    // Metadata field types are keyed by field key before being handed down.
    expect(screen.getByTestId("metadata-type-keys").textContent).toBe(
      "sample_type",
    );

    await waitFor(() =>
      expect(screen.getByTestId("sample-types-count").textContent).toBe("2"),
    );
  });

  it("omits the report link unless showReportLink is set", async () => {
    renderSidebar();
    expect(screen.queryByText("See Report")).toBeNull();
    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("renders a See Report link to the sample view when showReportLink is set", async () => {
    renderSidebar({ showReportLink: true });
    const link = screen.getByText("See Report") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toContain("/samples/42");
    expect(link.getAttribute("target")).toBe("_blank");
    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("renders nothing tab-specific when the metadata query returns no values", async () => {
    mockState.sampleMetadata = {};
    renderSidebar();
    expect(screen.queryByTestId("metadata-tab")).toBeNull();
    // The shell (title + tabs) still renders.
    expect(screen.getByText("Metadata")).toBeTruthy();
    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("switches to the Pipelines tab and back to Notes", async () => {
    renderSidebar();

    fireEvent.click(screen.getByText("Pipelines"));
    expect(screen.getByTestId("pipeline-tab").textContent).toBe(
      "pipeline:42:none",
    );
    expect(screen.queryByTestId("metadata-tab")).toBeNull();

    fireEvent.click(screen.getByText("Notes"));
    expect(screen.getByTestId("notes-tab")).toBeTruthy();
    expect(screen.queryByTestId("pipeline-tab")).toBeNull();

    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("shows the workflow sub-tabs only when the sample has more than one workflow", async () => {
    const { rerender } = renderSidebar({
      sampleWorkflowLabels: [WORKFLOW_TABS.SHORT_READ_MNGS],
    });
    fireEvent.click(screen.getByText("Pipelines"));
    expect(screen.queryByText(WORKFLOW_TABS.CONSENSUS_GENOME)).toBeNull();

    rerender(
      <SampleDetailsMode
        sampleId={42}
        sampleWorkflowLabels={[
          WORKFLOW_TABS.SHORT_READ_MNGS,
          WORKFLOW_TABS.CONSENSUS_GENOME,
        ]}
      />,
    );
    expect(screen.getByText(WORKFLOW_TABS.CONSENSUS_GENOME)).toBeTruthy();
    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("offers the consensus-genome run dropdown only when several CG runs exist", async () => {
    const cgRuns = [
      { id: 10, workflow: WorkflowType.CONSENSUS_GENOME },
      { id: 11, workflow: WorkflowType.CONSENSUS_GENOME },
      { id: 12, workflow: WorkflowType.AMR },
    ];
    const onWorkflowRunSelect = jest.fn();

    renderSidebar({
      currentWorkflowTab: WORKFLOW_TABS.CONSENSUS_GENOME,
      sample: { workflow_runs: cgRuns },
      onWorkflowRunSelect,
      currentRun: { id: 10 },
    });
    fireEvent.click(screen.getByText("Pipelines"));

    // Only the two CG runs are passed down; the AMR run is filtered out.
    const dropdown = screen.getByTestId("cg-dropdown");
    expect(dropdown.textContent).toBe("cg-runs:2");

    fireEvent.click(dropdown);
    expect(onWorkflowRunSelect).toHaveBeenCalledWith(cgRuns[1]);
    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("hides the consensus-genome dropdown when only one CG run exists", async () => {
    renderSidebar({
      currentWorkflowTab: WORKFLOW_TABS.CONSENSUS_GENOME,
      sample: {
        workflow_runs: [{ id: 10, workflow: WorkflowType.CONSENSUS_GENOME }],
      },
    });
    fireEvent.click(screen.getByText("Pipelines"));
    expect(screen.queryByTestId("cg-dropdown")).toBeNull();
    expect(screen.getByTestId("pipeline-tab")).toBeTruthy();
    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("does not save a metadata field that was never changed", async () => {
    renderSidebar();
    fireEvent.click(screen.getByTestId("save-sample-type"));
    expect(mockCommitUpdateMetadata).not.toHaveBeenCalled();
    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("commits the metadata mutation after a change is followed by a save", async () => {
    const onMetadataUpdate = jest.fn();
    renderSidebar({ onMetadataUpdate });

    fireEvent.click(screen.getByTestId("change-sample-type"));
    fireEvent.click(screen.getByTestId("save-sample-type"));

    expect(mockCommitUpdateMetadata).toHaveBeenCalledTimes(1);
    expect(mockCommitUpdateMetadata.mock.calls[0][0].variables).toEqual({
      sampleId: "42",
      input: {
        field: "sample_type",
        // formatSendValue wraps scalars in a typed one-of union.
        value: { String: "CSF" },
        authenticityToken: "csrf-token",
      },
    });
    expect(onMetadataUpdate).toHaveBeenCalledWith("sample_type", "CSF");
    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("saves immediately when the change requests shouldSave", async () => {
    renderSidebar();
    fireEvent.click(screen.getByTestId("change-and-save"));

    await waitFor(() => expect(mockCommitUpdateMetadata).toHaveBeenCalled());
    expect(
      mockCommitUpdateMetadata.mock.calls[0][0].variables.input.value,
    ).toEqual({ String: "Serum" });
  });

  it("refetches the metadata query when a save completes successfully", async () => {
    renderSidebar({ snapshotShareId: "snap-1" });
    fireEvent.click(screen.getByTestId("change-sample-type"));
    fireEvent.click(screen.getByTestId("save-sample-type"));

    const { onCompleted } = mockCommitUpdateMetadata.mock.calls[0][0];
    act(() => onCompleted({ UpdateMetadata: { status: "ok" } }));

    expect(mockLoadMetadataQuery).toHaveBeenCalledWith(
      { sampleId: "42", snapshotLinkId: "snap-1" },
      { fetchPolicy: "network-only" },
    );
    // The pending error slot for the field was cleared when the change landed.
    expect(screen.getByTestId("metadata-errors").textContent).toBe(
      JSON.stringify({ sample_type: null }),
    );
    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("surfaces the server message when a save fails", async () => {
    renderSidebar();
    fireEvent.click(screen.getByTestId("change-sample-type"));
    fireEvent.click(screen.getByTestId("save-sample-type"));

    const { onCompleted } = mockCommitUpdateMetadata.mock.calls[0][0];
    act(() =>
      onCompleted({
        UpdateMetadata: { status: "failed", message: "Invalid sample type" },
      }),
    );

    expect(screen.getByTestId("metadata-errors").textContent).toBe(
      JSON.stringify({ sample_type: "Invalid sample type" }),
    );
    // A failed save must not trigger a refetch.
    expect(mockLoadMetadataQuery).not.toHaveBeenCalled();
    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("surfaces the server message when a sample-name save fails", async () => {
    renderSidebar();
    fireEvent.click(screen.getByTestId("change-name"));
    fireEvent.click(screen.getByTestId("save-name"));

    const { onCompleted } = mockCommitUpdateSampleName.mock.calls[0][0];
    act(() =>
      onCompleted({
        UpdateSampleName: { status: "failed", message: "Invalid name" },
      }),
    );

    expect(screen.getByTestId("metadata-errors").textContent).toBe(
      JSON.stringify({ name: "Invalid name" }),
    );
    // A failed save must not trigger a refetch.
    expect(mockLoadMetadataQuery).not.toHaveBeenCalled();
    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("surfaces network errors from a save", async () => {
    renderSidebar();
    fireEvent.click(screen.getByTestId("change-sample-type"));
    fireEvent.click(screen.getByTestId("save-sample-type"));

    const { onError } = mockCommitUpdateMetadata.mock.calls[0][0];
    act(() => onError("network down"));

    expect(screen.getByTestId("metadata-errors").textContent).toBe(
      JSON.stringify({ sample_type: "network down" }),
    );
    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("routes a sample-name save to the rename mutation", async () => {
    renderSidebar();
    fireEvent.click(screen.getByTestId("change-name"));
    fireEvent.click(screen.getByTestId("save-name"));

    expect(mockCommitUpdateMetadata).not.toHaveBeenCalled();
    expect(mockCommitUpdateSampleName).toHaveBeenCalledTimes(1);
    expect(mockCommitUpdateSampleName.mock.calls[0][0].variables).toEqual({
      sampleId: "42",
      input: { value: "Renamed", authenticityToken: "csrf-token" },
    });
    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("routes a note save to the notes mutation", async () => {
    renderSidebar();
    fireEvent.click(screen.getByText("Notes"));
    fireEvent.click(screen.getByTestId("change-note"));
    fireEvent.click(screen.getByTestId("save-note"));

    expect(mockCommitUpdateSampleNotes).toHaveBeenCalledTimes(1);
    expect(mockCommitUpdateSampleNotes.mock.calls[0][0].variables).toEqual({
      sampleId: "42",
      input: { value: "a new note", authenticityToken: "csrf-token" },
    });
    await waitFor(() => expect(mockGetAllSampleTypes).toHaveBeenCalled());
  });

  it("resets the displayed name when the sample id changes", async () => {
    const { rerender } = renderSidebar();
    expect(screen.getByTestId("name-local").textContent).toBe("Sample A");

    mockState.sampleMetadata = {
      SampleMetadata: {
        additional_info: {
          ...sampleMetadataFixture.SampleMetadata.additional_info,
          name: "Sample B",
        },
      },
    };
    rerender(<SampleDetailsMode sampleId={99} />);

    await waitFor(() =>
      expect(screen.getByTestId("name-local").textContent).toBe("Sample B"),
    );
  });
});
