// Coverage: app/assets/src/components/common/DetailsSidebar/SampleDetailsMode/components/MetadataTab/components/MetadataSectionContent/MetadataSectionContent.tsx
//
// Branch-focused suite. MetadataSectionContent builds the FieldList rows for one
// metadata section and has a dense set of conditionals: the "Sample Info"
// special-case block (read mode vs edit mode), the project-link ternary that
// switches on snapshotShareId, the per-field editing ternary, the long-read-mngs
// field-hiding rule, the "name" vs metadata-key split inside the change handler,
// the metadataErrors reconciliation effect and the sample-switch reset effect.
// Each of those is exercised in BOTH directions here.
//
// react-relay's useFragment is stubbed to hand the fragment key straight back,
// MetadataInput and the shared Input control are stubbed so the assertions land
// on this component's own logic rather than on the input widgets.
import { fireEvent, render, screen } from "@testing-library/react";

// jest.config.js maps "\.(css|scss)$" to a style mock, but the "~" webpack alias
// is registered first and wins, so an aliased stylesheet import is handed to the
// TS transform and blows up. This component (and MetadataValue) import their
// stylesheet through "~/...", so stub that module id explicitly.
jest.mock(
  "~/components/common/DetailsSidebar/SampleDetailsMode/sample_details_mode.scss",
  () => ({}),
);

jest.mock("react-relay", () => ({
  useFragment: (_fragment: unknown, key: unknown) => key,
}));

jest.mock("~/components/common/Metadata/MetadataInput", () => {
  const ReactLib = require("react");
  return {
    __esModule: true,
    default: (props: Record<string, $TSFixMe>) => {
      const key = props.metadataType.key;
      return ReactLib.createElement(
        "div",
        { "data-testid": `metadata-input-${key}` },
        ReactLib.createElement(
          "span",
          { "data-testid": `mi-value-${key}` },
          String(props.value),
        ),
        ReactLib.createElement(
          "span",
          { "data-testid": `mi-ishuman-${key}` },
          String(props.isHuman),
        ),
        ReactLib.createElement(
          "span",
          { "data-testid": `mi-taxa-${key}` },
          String(props.taxaCategory),
        ),
        ReactLib.createElement(
          "button",
          {
            "data-testid": `mi-change-${key}`,
            onClick: () => props.onChange(key, `edited-${key}`, false),
          },
          "change",
        ),
        ReactLib.createElement(
          "button",
          {
            "data-testid": `mi-save-${key}`,
            onClick: () => props.onSave(key),
          },
          "save",
        ),
      );
    },
  };
});

jest.mock("~/components/ui/controls/Input", () => {
  const ReactLib = require("react");
  return {
    __esModule: true,
    default: (props: Record<string, $TSFixMe>) =>
      ReactLib.createElement("input", {
        "data-testid": "sample-name-input",
        type: props.type,
        value: props.value,
        onBlur: props.onBlur,
        onChange: (e: $TSFixMe) => props.onChange(e.target.value),
      }),
  };
});

import { MetadataSectionContent } from "~/components/common/DetailsSidebar/SampleDetailsMode/components/MetadataTab/components/MetadataSectionContent/MetadataSectionContent";
import { WORKFLOW_TABS } from "~/components/utils/workflows";

const metadataTypes = {
  sample_type: { key: "sample_type", name: "Sample Type", dataType: "string" },
  collection_location: {
    key: "collection_location",
    name: "Collection Location",
    dataType: "location",
  },
  host_age: { key: "host_age", name: "Host Age", dataType: "number" },
  library_prep: {
    key: "library_prep",
    name: "Library Prep",
    dataType: "string",
  },
  sequencer: { key: "sequencer", name: "Sequencer", dataType: "string" },
} as $TSFixMe;

const rawMetadata = [
  {
    key: "sample_type",
    base_type: "string",
    string_validated_value: "Whole Blood",
  },
  {
    key: "collection_location",
    base_type: "location",
    location_validated_value: { name: "San Francisco, CA" },
  },
  { key: "host_age", base_type: "number", number_validated_value: 65 },
  {
    key: "library_prep",
    base_type: "string",
    string_validated_value: "NEB Ultra II",
  },
  { key: "sequencer", base_type: "string", string_validated_value: "MinION" },
];

const additionalInfo = {
  project_id: 7,
  project_name: "Rainforest Project",
  name: "server-side-name",
  upload_date: "2026-01-01",
  host_genome_name: "Human",
  host_genome_taxa_category: "human",
} as $TSFixMe;

const baseProps = {
  additionalInfo,
  currentWorkflowTab: WORKFLOW_TABS.SHORT_READ_MNGS,
  metadataTypes,
  nameLocal: "Local Sample Name",
  onMetadataChange: jest.fn(),
  onMetadataSave: jest.fn().mockResolvedValue(undefined),
  sampleId: 101,
  sampleTypes: [],
  section: {
    name: "Sample Info",
    keys: ["sample_type", "collection_location"],
  },
  sectionEditing: {},
  setNameLocal: jest.fn(),
  metadataTabFragmentKey: { metadata: rawMetadata },
};

const renderContent = (props: Record<string, unknown> = {}) =>
  render(
    <MetadataSectionContent {...({ ...baseProps, ...props } as $TSFixMe)} />,
  );

describe("MetadataSectionContent branch coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Sample Info special-case block, read mode", () => {
    it("renders the SAMPLE_ADDITIONAL_INFO rows, preferring nameLocal over additionalInfo.name", () => {
      renderContent();

      // info.key === "name" -> nameLocal wins over additionalInfo.name.
      expect(screen.getByTestId("sample-name-value").textContent).toBe(
        "Local Sample Name",
      );
      expect(screen.queryByText("server-side-name")).toBeNull();

      // info.key !== "name" and !== "project_name" -> straight off additionalInfo.
      expect(screen.getByTestId("upload-date-value").textContent).toBe(
        "2026-01-01",
      );
      expect(screen.getByTestId("host-value").textContent).toBe("Human");
    });

    it("renders the project row as a link back to /home when there is no snapshot share id", () => {
      const { container } = renderContent();

      const link = container.querySelector("a");
      expect(link).not.toBeNull();
      expect(link?.getAttribute("href")).toBe("/home?project_id=7");
      expect(link?.textContent).toBe("Rainforest Project");
    });

    it("points the project link at the public snapshot url when snapshotShareId is set", () => {
      const { container } = renderContent({ snapshotShareId: "abc123" });

      expect(container.querySelector("a")?.getAttribute("href")).toBe(
        "/pub/abc123",
      );
    });

    it("renders the read-only metadata values from the processed fragment", () => {
      renderContent();

      expect(screen.getByTestId("sample-type-value").textContent).toBe(
        "Whole Blood",
      );
      // Location objects are flattened to their .name by processMetadata.
      expect(screen.getByTestId("collection-location-value").textContent).toBe(
        "San Francisco, CA",
      );
      // Read mode -> no editing widgets.
      expect(screen.queryByTestId("metadata-input-sample_type")).toBeNull();
      expect(screen.queryByTestId("sample-name-input")).toBeNull();
    });
  });

  describe("Sample Info special-case block, edit mode", () => {
    const editingProps = { sectionEditing: { "Sample Info": true } };

    it("swaps the additional-info rows for a Sample Name input", () => {
      renderContent(editingProps);

      expect(screen.getByTestId("sample-name-input")).toBeTruthy();
      // The read-mode-only rows are gone.
      expect(screen.queryByTestId("upload-date-value")).toBeNull();
      expect(screen.queryByTestId("host-value")).toBeNull();
      // ...and the metadata rows became inputs.
      expect(screen.getByTestId("metadata-input-sample_type")).toBeTruthy();
    });

    it("routes a Sample Name edit to setNameLocal, not to the local metadata map", () => {
      renderContent(editingProps);

      fireEvent.change(screen.getByTestId("sample-name-input"), {
        target: { value: "Renamed Sample" },
      });

      expect(baseProps.setNameLocal).toHaveBeenCalledWith("Renamed Sample");
      expect(baseProps.onMetadataChange).toHaveBeenCalledWith(
        "name",
        "Renamed Sample",
        undefined,
      );
      // The metadata input value is untouched by a name edit.
      expect(screen.getByTestId("mi-value-sample_type").textContent).toBe(
        "Whole Blood",
      );
    });

    it("saves the sample name on blur", () => {
      renderContent(editingProps);

      fireEvent.blur(screen.getByTestId("sample-name-input"));

      expect(baseProps.onMetadataSave).toHaveBeenCalledWith("name", {
        name: "Local Sample Name",
      });
    });

    it("routes a metadata edit into local state instead of setNameLocal", () => {
      renderContent(editingProps);

      fireEvent.click(screen.getByTestId("mi-change-sample_type"));

      expect(screen.getByTestId("mi-value-sample_type").textContent).toBe(
        "edited-sample_type",
      );
      expect(baseProps.setNameLocal).not.toHaveBeenCalled();
      expect(baseProps.onMetadataChange).toHaveBeenCalledWith(
        "sample_type",
        "edited-sample_type",
        false,
      );
    });

    it("saves the whole local metadata map, including unsaved edits", () => {
      renderContent(editingProps);

      fireEvent.click(screen.getByTestId("mi-change-collection_location"));
      fireEvent.click(screen.getByTestId("mi-save-collection_location"));

      expect(baseProps.onMetadataSave).toHaveBeenCalledWith(
        "collection_location",
        expect.objectContaining({
          collection_location: "edited-collection_location",
          sample_type: "Whole Blood",
        }),
      );
    });

    it("forwards the human host-genome category to the metadata inputs", () => {
      renderContent(editingProps);

      expect(screen.getByTestId("mi-ishuman-sample_type").textContent).toBe(
        "true",
      );
      expect(screen.getByTestId("mi-taxa-sample_type").textContent).toBe(
        "human",
      );
    });

    it("reports a non-human host-genome category as isHuman=false", () => {
      renderContent({
        ...editingProps,
        additionalInfo: {
          ...additionalInfo,
          host_genome_taxa_category: "non-human",
        },
      });

      expect(screen.getByTestId("mi-ishuman-sample_type").textContent).toBe(
        "false",
      );
      expect(screen.getByTestId("mi-taxa-sample_type").textContent).toBe(
        "non-human",
      );
    });
  });

  describe("metadataErrors", () => {
    it("renders no error markup when metadataErrors is omitted entirely", () => {
      renderContent({ sectionEditing: { "Sample Info": true } });

      expect(screen.queryByText("Invalid sample type")).toBeNull();
    });

    it("shows the per-field error under the input when one is present", () => {
      renderContent({
        sectionEditing: { "Sample Info": true },
        metadataErrors: { sample_type: "Invalid sample type" },
      });

      expect(screen.getByText("Invalid sample type")).toBeTruthy();
    });

    it("shows the error for sample name when it is present in metadataErrors", () => {
      renderContent({
        sectionEditing: { "Sample Info": true },
        metadataErrors: { name: "Invalid sample name" },
      });

      expect(screen.getByText("Invalid sample name")).toBeTruthy();
    });

    it("renders no error for a field whose error entry is null", () => {
      renderContent({
        sectionEditing: { "Sample Info": true },
        metadataErrors: { sample_type: null, collection_location: null },
      });

      expect(screen.getByTestId("metadata-input-sample_type")).toBeTruthy();
      expect(screen.queryByText("Invalid sample type")).toBeNull();
    });

    it("reverts a locally edited value back to the fragment value when that field errored", () => {
      renderContent({
        sectionEditing: { "Sample Info": true },
        metadataErrors: { sample_type: "Invalid sample type" },
      });

      fireEvent.click(screen.getByTestId("mi-change-sample_type"));

      // The reconciliation effect pulls the server value back over the edit.
      expect(screen.getByTestId("mi-value-sample_type").textContent).toBe(
        "Whole Blood",
      );
    });

    it("leaves local edits alone when the errored key is not a metadata key", () => {
      renderContent({
        sectionEditing: { "Sample Info": true },
        metadataErrors: { not_a_metadata_key: "boom" },
      });

      fireEvent.click(screen.getByTestId("mi-change-sample_type"));

      expect(screen.getByTestId("mi-value-sample_type").textContent).toBe(
        "edited-sample_type",
      );
    });
  });

  describe("non-'Sample Info' sections", () => {
    const hostSection = {
      name: "Host Info",
      keys: ["host_age", "sample_type"],
    };

    it("skips both Sample Info blocks in read mode", () => {
      renderContent({ section: hostSection });

      expect(screen.queryByTestId("upload-date-value")).toBeNull();
      expect(screen.queryByTestId("project-value")).toBeNull();
      expect(screen.queryByTestId("sample-name-input")).toBeNull();
      expect(screen.getByTestId("host-age-value").textContent).toBe("65");
    });

    it("skips the Sample Name input even while the section is editing", () => {
      renderContent({
        section: hostSection,
        sectionEditing: { "Host Info": true },
      });

      expect(screen.queryByTestId("sample-name-input")).toBeNull();
      expect(screen.getByTestId("metadata-input-host_age")).toBeTruthy();
    });
  });

  describe("key filtering", () => {
    it("drops section keys that have no matching metadata type", () => {
      renderContent({
        section: {
          name: "Host Info",
          keys: ["sample_type", "not_a_registered_type"],
        },
      });

      expect(screen.getByTestId("sample-type-value")).toBeTruthy();
      expect(screen.queryByTestId("not-a-registered-type-value")).toBeNull();
    });

    it("hides Library Prep and Sequencer for long-read-mngs samples only", () => {
      const section = {
        name: "Sequencing Info",
        keys: ["library_prep", "sequencer", "sample_type"],
      };

      const illumina = renderContent({ section });
      expect(screen.getByTestId("library-prep-value").textContent).toBe(
        "NEB Ultra II",
      );
      expect(screen.getByTestId("sequencer-value").textContent).toBe("MinION");
      illumina.unmount();

      renderContent({
        section,
        currentWorkflowTab: WORKFLOW_TABS.LONG_READ_MNGS,
      });
      expect(screen.queryByTestId("library-prep-value")).toBeNull();
      expect(screen.queryByTestId("sequencer-value")).toBeNull();
      // Unrelated fields are untouched by the hiding rule.
      expect(screen.getByTestId("sample-type-value").textContent).toBe(
        "Whole Blood",
      );
    });
  });

  describe("switching samples", () => {
    it("discards unsaved local edits when the sampleId changes", () => {
      const { rerender } = renderContent({
        sectionEditing: { "Sample Info": true },
      });

      fireEvent.click(screen.getByTestId("mi-change-sample_type"));
      expect(screen.getByTestId("mi-value-sample_type").textContent).toBe(
        "edited-sample_type",
      );

      rerender(
        <MetadataSectionContent
          {...({
            ...baseProps,
            sectionEditing: { "Sample Info": true },
            sampleId: 202,
            metadataTabFragmentKey: {
              metadata: [
                {
                  key: "sample_type",
                  base_type: "string",
                  string_validated_value: "Nasopharyngeal Swab",
                },
                {
                  key: "collection_location",
                  base_type: "location",
                  location_validated_value: { name: "Boston, MA" },
                },
              ],
            },
          } as $TSFixMe)}
        />,
      );

      expect(screen.getByTestId("mi-value-sample_type").textContent).toBe(
        "Nasopharyngeal Swab",
      );
    });

    it("keeps unsaved local edits across a re-render with the same sampleId", () => {
      const { rerender } = renderContent({
        sectionEditing: { "Sample Info": true },
      });

      fireEvent.click(screen.getByTestId("mi-change-sample_type"));

      rerender(
        <MetadataSectionContent
          {...({
            ...baseProps,
            sectionEditing: { "Sample Info": true },
            nameLocal: "Local Sample Name v2",
          } as $TSFixMe)}
        />,
      );

      expect(screen.getByTestId("mi-value-sample_type").textContent).toBe(
        "edited-sample_type",
      );
    });
  });

  describe("missing additionalInfo", () => {
    it("falls back to an empty project link and empty values when additionalInfo is null", () => {
      const { container } = renderContent({ additionalInfo: null });

      expect(container.querySelector("a")?.getAttribute("href")).toBe(
        "/home?project_id=undefined",
      );
      // MetadataValue renders the em-dash placeholder for missing values.
      expect(screen.getByTestId("upload-date-value").textContent).toBe("--");
      expect(screen.getByTestId("host-value").textContent).toBe("--");
      // nameLocal still wins for the name row.
      expect(screen.getByTestId("sample-name-value").textContent).toBe(
        "Local Sample Name",
      );
    });
  });

  describe("empty fragment", () => {
    it("renders the section with placeholder values when the fragment has no metadata", () => {
      renderContent({ metadataTabFragmentKey: { metadata: null } });

      expect(screen.getByTestId("sample-type-value").textContent).toBe("--");
      expect(screen.getByTestId("collection-location-value").textContent).toBe(
        "--",
      );
    });
  });
});
