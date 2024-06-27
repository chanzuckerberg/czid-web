import { find, set, size } from "lodash/fp";
import React, { useEffect, useState } from "react";
import {
  graphql,
  useLazyLoadQuery,
  useMutation,
  useQueryLoader,
} from "react-relay";
import { getAllSampleTypes } from "~/api";
import { getCsrfToken } from "~/api/utils";
import Tabs from "~/components/ui/controls/Tabs";
import { isNotNullish } from "~/components/utils/typeUtils";
import {
  generateUrlToSampleView,
  TempSelectedOptionsShape,
} from "~/components/utils/urls";
import { WorkflowType, WORKFLOW_TABS } from "~/components/utils/workflows";
import { ConsensusGenomeDropdown } from "~/components/views/SampleView/components/ConsensusGenomeView/components/ConsensusGenomeHeader/components/ConsensusGenomeDropdown";
import { usePrevious } from "~/helpers/customHooks/usePrevious";
import Sample, { WorkflowRun } from "~/interface/sample";
import { CurrentTabSample } from "~/interface/sampleView";
import {
  LocationObject,
  MetadataType,
  MetadataTypes,
  PipelineRun,
  SampleId,
  SampleType,
  SnapshotShareId,
} from "~/interface/shared";
import { formatSendValue, processMetadataTypes } from "~utils/metadata";
import { MetadataTab } from "./components/MetadataTab";
import { NotesTab } from "./components/NotesTab";
import { PipelineTab } from "./components/PipelineTab";
import { SIDEBAR_TABS } from "./constants";
import cs from "./sample_details_mode.scss";
import { AdditionalInfo, SidebarTabName } from "./types";
import { processAdditionalInfo } from "./utils";
import { SampleDetailsModeSampleMetadataFieldsQuery } from "./__generated__/SampleDetailsModeSampleMetadataFieldsQuery.graphql";
import { SampleDetailsModeSampleMetadataQuery } from "./__generated__/SampleDetailsModeSampleMetadataQuery.graphql";
import { SampleDetailsModeUpdateMetadataMutation } from "./__generated__/SampleDetailsModeUpdateMetadataMutation.graphql";
import { SampleDetailsModeUpdateSampleNameMutation } from "./__generated__/SampleDetailsModeUpdateSampleNameMutation.graphql";
import { SampleDetailsModeUpdateSampleNotesMutation } from "./__generated__/SampleDetailsModeUpdateSampleNotesMutation.graphql";

export interface SampleDetailsModeProps {
  currentRun?: WorkflowRun | PipelineRun;
  currentWorkflowTab?: CurrentTabSample;
  handleWorkflowTabChange?: (tab: CurrentTabSample) => void;
  sample?: Sample;
  sampleId: SampleId;
  sampleWorkflowLabels?: string[];
  onMetadataUpdate?: (key: $TSFixMeUnknown, value: $TSFixMeUnknown) => void;
  onWorkflowRunSelect?: $TSFixMeFunction;
  snapshotShareId?: SnapshotShareId;
  pipelineVersion?: string; // Needs to be string for 3.1 vs. 3.10.
  showReportLink?: boolean;
  tempSelectedOptions?: TempSelectedOptionsShape;
}

const SampleMetadataFieldsQuery = graphql`
  query SampleDetailsModeSampleMetadataFieldsQuery(
    $snapshotLinkId: String
    $input: queryInput_MetadataFields_input_Input!
  ) {
    MetadataFields(snapshotLinkId: $snapshotLinkId, input: $input) {
      key
      dataType
      name
      options
      host_genome_ids
      description
      is_required
      isBoolean
      group
    }
  }
`;

const SampleMetadataQuery = graphql`
  query SampleDetailsModeSampleMetadataQuery(
    $sampleId: String!
    $snapshotLinkId: String
  ) {
    SampleMetadata(sampleId: $sampleId, snapshotLinkId: $snapshotLinkId) {
      ...MetadataTabMetadataFragment
      ...NotesTabFragment
      ...MetadataSectionContentFragment
      additional_info {
        name
        ...PipelineTabFragment
        editable
        project_id
        project_name
        host_genome_taxa_category
        host_genome_name
        upload_date
      }
    }
  }
`;

const UpdateMetadataMutation = graphql`
  mutation SampleDetailsModeUpdateMetadataMutation(
    $sampleId: String!
    $input: mutationInput_UpdateMetadata_input_Input!
  ) {
    UpdateMetadata(sampleId: $sampleId, input: $input) {
      status
      message
    }
  }
`;

const UpdateSampleNameMutation = graphql`
  mutation SampleDetailsModeUpdateSampleNameMutation(
    $sampleId: String!
    $input: mutationInput_UpdateSampleNotes_input_Input!
  ) {
    UpdateSampleName(sampleId: $sampleId, input: $input) {
      status
      message
    }
  }
`;

const UpdateSampleNotesMutation = graphql`
  mutation SampleDetailsModeUpdateSampleNotesMutation(
    $sampleId: String!
    $input: mutationInput_UpdateSampleNotes_input_Input!
  ) {
    UpdateSampleNotes(sampleId: $sampleId, input: $input) {
      status
      message
    }
  }
`;

export const SampleDetailsMode = ({
  currentRun,
  currentWorkflowTab,
  handleWorkflowTabChange,
  sample,
  sampleId,
  onMetadataUpdate,
  onWorkflowRunSelect,
  showReportLink,
  snapshotShareId,
  tempSelectedOptions,
  sampleWorkflowLabels,
}: SampleDetailsModeProps) => {
  const authenticityToken = getCsrfToken();
  const [currentTabSidebar, setCurrentTabSidebar] = useState(SIDEBAR_TABS[0]);
  const [metadataChanged, setMetadataChanged] = useState<
    Record<string, boolean>
  >({});
  const [metadataErrors, setMetadataErrors] = useState<
    Record<string, string | null>
  >({});
  const [sampleTypes, setSampleTypes] = useState<SampleType[] | null>(null);
  const [singleKeyValueToSave, setSingleKeyValueToSave] = useState<
    [string, string | number | LocationObject] | null
  >(null);

  const metadataFields =
    useLazyLoadQuery<SampleDetailsModeSampleMetadataFieldsQuery>(
      SampleMetadataFieldsQuery,
      {
        snapshotLinkId: snapshotShareId,
        input: {
          sampleIds: [String(sampleId)],
          authenticityToken: authenticityToken,
        },
      },
    );

  const [, loadMetadataQuery] =
    useQueryLoader<SampleDetailsModeSampleMetadataQuery>(SampleMetadataQuery);

  const sampleMetadataFields = metadataFields?.MetadataFields;
  const metadataTypes: MetadataTypes = processMetadataTypes(
    sampleMetadataFields as MetadataType[],
  );

  const sampleMetadata = useLazyLoadQuery<SampleDetailsModeSampleMetadataQuery>(
    SampleMetadataQuery,
    {
      sampleId: String(sampleId),
      snapshotLinkId: snapshotShareId,
    },
  );

  const sampleMetadataValues = sampleMetadata?.SampleMetadata;

  const additionalInfo: AdditionalInfo = processAdditionalInfo(
    sampleMetadataValues?.additional_info as AdditionalInfo,
  );
  const [nameLocal, setNameLocal] = useState(additionalInfo?.name);

  const prevProps = usePrevious({
    sampleId,
  });
  const isSampleIdChanged = prevProps?.sampleId !== sampleId;

  // If the sampleId is changed, reset the nameLocal to the name of the sample
  useEffect(() => {
    if (isSampleIdChanged) {
      setNameLocal(additionalInfo?.name);
    }
  }, [additionalInfo?.name, isSampleIdChanged]);

  useEffect(() => {
    getAllSampleTypes().then(fetchedSampleTypes => {
      setSampleTypes(fetchedSampleTypes);
    });
  }, []);

  useEffect(() => {
    // _save relies on this.state.metadata being up-to-date
    if (singleKeyValueToSave) {
      const [key, value] = singleKeyValueToSave;
      _save(sampleId, key, value);
      setSingleKeyValueToSave(null);
    }
  }, [singleKeyValueToSave]);

  const onTabChange = (tab: SidebarTabName) => {
    setCurrentTabSidebar(tab);
  };

  // shouldSave option is used when <Input> option is selected
  // to change and save in one call (to avoid setState issues)
  const handleMetadataChange = (
    key: string,
    value: string | number | LocationObject,
    shouldSave?: boolean,
  ) => {
    /* Sample name and note are special cases */
    if (key === "name" || key === "notes") {
      setMetadataChanged(set(key, true, metadataChanged));
      return;
    }
    if (shouldSave) {
      setSingleKeyValueToSave([key, value]);
    }
    setMetadataChanged(set(key, !shouldSave, metadataChanged));
    setMetadataErrors(set(key, null, metadataErrors));
  };

  const handleMetadataSave = async (key: string, metadata) => {
    if (metadataChanged[key]) {
      const newValue = metadata[key];
      setMetadataChanged(set(key, false, metadataChanged));
      _save(sampleId, key, newValue);
    }
  };

  const [commitUpdateMetadataMutation, isUpdateMetadataMutationInFlight] =
    useMutation<SampleDetailsModeUpdateMetadataMutation>(
      UpdateMetadataMutation,
    );

  const [commitUpdateSampleNameMutation, isUpdateSampleNameMutationInFlight] =
    useMutation<SampleDetailsModeUpdateSampleNameMutation>(
      UpdateSampleNameMutation,
    );

  const [commitUpdateSampleNotesMutation, isUpdateSampleNotesMutationInFlight] =
    useMutation<SampleDetailsModeUpdateSampleNotesMutation>(
      UpdateSampleNotesMutation,
    );

  const _save = async (
    id: number | string,
    key: string,
    value: string | number | LocationObject,
  ) => {
    let _metadataErrors = metadataErrors;

    // When metadata is saved, fire event.
    if (onMetadataUpdate) {
      onMetadataUpdate(key, value);
    }

    const onMetadataSaveCompleted = data => {
      if (data.UpdateMetadata?.status === "failed") {
        _metadataErrors = set(
          key,
          data.UpdateMetadata.message,
          _metadataErrors,
        );
        setMetadataErrors(_metadataErrors);
      } else {
        loadMetadataQuery(
          {
            sampleId: String(sampleId),
            snapshotLinkId: snapshotShareId,
          },
          {
            fetchPolicy: "network-only",
          },
        );
      }
    };

    const onMetadataSaveError = error => {
      _metadataErrors = set(key, error, _metadataErrors);
      setMetadataErrors(_metadataErrors);
    };

    if (key === "name") {
      commitUpdateSampleNameMutation({
        variables: {
          sampleId: id.toString(),
          input: {
            value: String(value),
            authenticityToken: authenticityToken,
          },
        },
        onCompleted: onMetadataSaveCompleted,
        onError: onMetadataSaveError,
      });
    } else if (key === "notes") {
      commitUpdateSampleNotesMutation({
        variables: {
          sampleId: id.toString(),
          input: {
            value: String(value),
            authenticityToken: authenticityToken,
          },
        },
        onCompleted: onMetadataSaveCompleted,
        onError: onMetadataSaveError,
      });
    } else {
      const sendValue = formatSendValue(value);
      commitUpdateMetadataMutation({
        variables: {
          sampleId: id.toString(),
          input: {
            field: key,
            value: sendValue,
            authenticityToken: authenticityToken,
          },
        },
        onError: onMetadataSaveError,
        onCompleted: onMetadataSaveCompleted,
      });
    }

    setMetadataErrors(_metadataErrors);
  };

  const renderTab = () => {
    const savePending =
      isUpdateMetadataMutationInFlight ||
      isUpdateSampleNameMutationInFlight ||
      isUpdateSampleNotesMutationInFlight;

    if (currentTabSidebar === "Metadata" && sampleMetadataValues) {
      return (
        <MetadataTab
          metadataTypes={metadataTypes}
          onMetadataChange={handleMetadataChange}
          onMetadataSave={handleMetadataSave}
          savePending={savePending}
          nameLocal={nameLocal}
          setNameLocal={setNameLocal}
          metadataErrors={metadataErrors}
          sampleId={sampleId}
          sampleTypes={sampleTypes || []}
          snapshotShareId={snapshotShareId}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          currentWorkflowTab={currentWorkflowTab}
          metadataTabFragmentKey={sampleMetadataValues}
        />
      );
    }
    if (
      currentTabSidebar === "Pipelines" &&
      sampleMetadataValues?.additional_info
    ) {
      const workflowTabs = size(sampleWorkflowLabels) > 1 && (
        <Tabs
          className={cs.workflowTabs}
          tabStyling={cs.tabLabels}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          tabs={sampleWorkflowLabels}
          value={currentWorkflowTab}
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
          onChange={handleWorkflowTabChange}
          hideBorder
        />
      );

      const consensusGenomeWorkflowRuns =
        sample &&
        sample.workflow_runs
          ?.filter(isNotNullish)
          .filter(run => run.workflow === WorkflowType.CONSENSUS_GENOME);

      return (
        <>
          {workflowTabs}
          {currentWorkflowTab === WORKFLOW_TABS.CONSENSUS_GENOME &&
            consensusGenomeWorkflowRuns &&
            size(consensusGenomeWorkflowRuns) > 1 && (
              <div className={cs.dropdownContainer}>
                <ConsensusGenomeDropdown
                  workflowRuns={consensusGenomeWorkflowRuns}
                  initialSelectedValue={currentRun?.id}
                  onConsensusGenomeSelection={workflowRunId =>
                    onWorkflowRunSelect &&
                    onWorkflowRunSelect(
                      find({ id: workflowRunId }, consensusGenomeWorkflowRuns),
                    )
                  }
                />
              </div>
            )}
          <PipelineTab
            currentRun={currentRun}
            currentWorkflowTab={currentWorkflowTab}
            pipelineTabFragmentKey={sampleMetadataValues?.additional_info}
            sampleId={sampleId}
            snapshotShareId={snapshotShareId}
          />
        </>
      );
    }
    if (currentTabSidebar === "Notes") {
      return (
        <NotesTab
          notesFragmentKey={sampleMetadataValues}
          onNoteChange={val => handleMetadataChange("notes", val)}
          onNoteSave={(notes: string | null | undefined) =>
            handleMetadataSave("notes", { notes: notes })
          }
          savePending={savePending}
        />
      );
    }
    return null;
  };

  return (
    <div className={cs.content}>
      <div className={cs.title}>{nameLocal}</div>
      {showReportLink && (
        <div className={cs.reportLink}>
          <a
            href={generateUrlToSampleView({
              sampleId: sampleId.toString(),
              persistDefaultBg: true,
              tempSelectedOptions,
            })}
            target="_blank"
            rel="noreferrer noopener"
          >
            See Report
          </a>
        </div>
      )}
      <Tabs
        className={cs.tabs}
        tabs={SIDEBAR_TABS}
        value={currentTabSidebar}
        onChange={onTabChange}
      />
      {renderTab()}
    </div>
  );
};
