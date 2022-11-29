import { gql } from "@apollo/client";

const GET_SAMPLES_QUERY = gql`
  query GetSamples(
    $projectId: Int!
    # $search: String!
    $domain: String
    $limit: Int
    $offset: Int
    $orderBy: String
    $orderDir: String
    $listAllIds: Boolean
    $basic: Boolean
    $sampleIds: [Int!]
    $hostIds: [Int!]
    $location: String
    $locationV2: [String!]
    $taxIds: [Int!]
    $taxLevels: [String!]
    $thresholdFilterInfo: String
    $annotations: [String!]
    $time: [String!]
    $tissue: [String!]
    $visibility: [String!]
    $searchString: String
    $requestedSampleIds: [Int!]
    $workflow: String
  ) {
    samplesList(
      projectId: $projectId
      # search: $search
      domain: $domain
      limit: $limit
      offset: $offset
      orderBy: $orderBy
      orderDir: $orderDir
      listAllIds: $listAllIds
      basic: $basic
      sampleIds: $sampleIds
      hostIds: $hostIds
      location: $location
      locationV2: $locationV2
      taxIds: $taxIds
      taxLevels: $taxLevels
      thresholdFilterInfo: $thresholdFilterInfo
      annotations: $annotations
      time: $time
      tissue: $tissue
      visibility: $visibility
      searchString: $searchString
      requestedSampleIds: $requestedSampleIds
      workflow: $workflow
    ) {
      samples {
        id
        name
        createdAt
        projectId
        hostGenomeId
        privateUntil
        public
        details {
          dbSample {
            id
            name
            createdAt
            updatedAt
            projectId
            status
            sampleNotes
            s3PreloadResultPath
            s3StarIndexPath
            s3Bowtie2IndexPath
            hostGenomeId
            userId
            subsample
            pipelineBranch
            alignmentConfigName
            webCommit
            pipelineCommit
            dagVars
            maxInputFragments
            clientUpdatedAt
            uploadedFromBasespace
            uploadError
            basespaceAccessToken
            doNotProcess
            pipelineExecutionStrategy
            useTaxonWhitelist
            initialWorkflow
            inputFiles {
              id
              name
              presignedUrl
              sampleId
              createdAt
              updatedAt
              sourceType
              source
              parts
              uploadClient
            }
            hostGenomeName
            privateUntil
          }
          metadata {
            collectionDate
            collectionLocationV2
            nucleotideType
            sampleType
            waterControl
          }
          derivedSampleOutput {
            pipelineRun {
              id
              sampleId
              createdAt
              updatedAt
              jobStatus
              finalized
              totalReads
              adjustedRemainingReads
              unmappedReads
              subsample
              pipelineBranch
              totalErccReads
              fractionSubsampled
              pipelineVersion
              pipelineCommit
              truncated
              resultsFinalized
              alignmentConfigId
              alertSent
              dagVars
              assembled
              maxInputFragments
              errorMessage
              knownUserError
              pipelineExecutionStrategy
              sfnExecutionArn
              useTaxonWhitelist
              wdlVersion
              s3OutputPrefix
              executedAt
              timeToFinalized
              timeToResultsFinalized
              qcPercent
              compressionRatio
              deprecated
            }
            hostGenomeName
            projectName
            summaryStats {
              adjustedRemainingReads
              compressionRatio
              qcPercent
              percentRemaining
              unmappedReads
              insertSizeMean
              insertSizeStandardDeviation
              lastProcessedAt
              readsAfterStar
              readsAfterTrimmomatic
              readsAfterPriceseq
              readsAfterCzidDedup
            }
          }
          uploader {
            name
            id
          }
          mngsRunInfo {
            totalRuntime
            withAssembly
            resultStatusDescription
            finalized
            reportReady
            createdAt
          }
          workflowRunsCountByWorkflow
        }
      }
      sampleIds
    }
  }
`;

export { GET_SAMPLES_QUERY };
