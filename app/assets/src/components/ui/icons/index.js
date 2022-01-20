import BacteriaCultureIcon from "./BacteriaCultureIcon";
import CZIDLogoReversed from "./CZIDLogoReversed";
import IconAlert from "./IconAlert";
import IconAlertSmall from "./IconAlertSmall";
import IconAlignmentSmall from "./IconAlignmentSmall";
import IconArrowDownSmall from "./IconArrowDownSmall";
import IconArrowPipelineStage from "./IconArrowPipelineStage";
import IconArrowRight from "./IconArrowRight";
import IconArrowUpSmall from "./IconArrowUpSmall";
import IconBackgroundModel from "./IconBackgroundModel";
import IconBrowserSmall from "./IconBrowserSmall";
import IconChartSmall from "./IconChartSmall";
import IconCheckSmall from "./IconCheckSmall";
import IconClose from "./IconClose";
import IconCloseSmall from "./IconCloseSmall";
import IconConsensusSmall from "./IconConsensusSmall";
import IconContigSmall from "./IconContigSmall";
import IconCopySmall from "./IconCopySmall";
import IconCoverage from "./IconCoverage";
import IconDownload from "./IconDownload";
import IconDownloadSmall from "./IconDownloadSmall";
import IconEditSmall from "./IconEditSmall";
import IconFilters from "./IconFilters";
import IconHeatmap from "./IconHeatmap";
import IconHeatmapPrivate from "./IconHeatmapPrivate";
import IconHeatmapPublic from "./IconHeatmapPublic";
import IconHelp from "./IconHelp";
import IconInfo from "./IconInfo";
import IconInfoPanel from "./IconInfoPanel";
import IconInfoSmall from "./IconInfoSmall";
import IconInsightSmall from "./IconInsightSmall";
import IconLoading from "./IconLoading";
import IconMember from "./IconMember";
import IconMemberSmall from "./IconMemberSmall";
import IconMinusSmall from "./IconMinusSmall";
import IconNextcladeLarge from "./IconNextcladeLarge";
import IconPhyloTree from "./IconPhyloTree";
import IconPhyloTreePrivate from "./IconPhyloTreePrivate";
import IconPhyloTreePublic from "./IconPhyloTreePublic";
import IconPhyloTreeSmall from "./IconPhyloTreeSmall";
import IconPlusCircleSmall from "./IconPlusCircleSmall";
import IconPlusSmall from "./IconPlusSmall";
import IconPrivateSmall from "./IconPrivateSmall";
import IconProjectPrivate from "./IconProjectPrivate";
import IconProjectPublic from "./IconProjectPublic";
import IconPublicSmall from "./IconPublicSmall";
import IconRefresh from "./IconRefresh";
import IconSample from "./IconSample";
import IconSamplePrivate from "./IconSamplePrivate";
import IconSamplePublic from "./IconSamplePublic";
import IconSave from "./IconSave";
import IconSearch from "./IconSearch";
import IconShare from "./IconShare";
import IconSubmitArrow from "./IconSubmitArrow";
import IconSuccess from "./IconSuccess";
import IconSuccessSmall from "./IconSuccessSmall";
import IconTableSmall from "./IconTableSmall";
import IconTempSmall from "./IconTempSmall";
import IconTreeSmall from "./IconTreeSmall";
import LogoColor from "./LogoColor";
import LogoLockupColor from "./LogoLockupColor";
import LogoLockupReversed from "./LogoLockupReversed";
import LogoMarkColor from "./LogoMarkColor";
import LogoMarkReversed from "./LogoMarkReversed";
import LogoReversed from "./LogoReversed";
import SortIcon from "./SortIcon";

export const ICONS_TAXONOMY = {
  CUSTOM: {
    BacteriaCultureIcon,
    IconAlert,
    IconAlertSmall,
    IconAlignmentSmall,
    IconArrowDownSmall,
    IconArrowPipelineStage,
    IconArrowRight,
    IconArrowUpSmall,
    IconBackgroundModel,
    IconBrowserSmall,
    IconChartSmall,
    IconCheckSmall,
    IconClose,
    IconCloseSmall,
    IconConsensusSmall,
    IconContigSmall,
    IconCopySmall,
    IconCoverage,
    IconDownload,
    IconDownloadSmall,
    IconEditSmall,
    IconFilters,
    IconHeatmap,
    IconHeatmapPrivate,
    IconHeatmapPublic,
    IconHelp,
    IconInfo,
    IconInfoPanel,
    IconInfoSmall,
    IconInsightSmall,
    IconLoading,
    IconMember,
    IconMemberSmall,
    IconMinusSmall,
    IconNextcladeLarge,
    IconPhyloTree,
    IconPhyloTreePrivate,
    IconPhyloTreePublic,
    IconPhyloTreeSmall,
    IconPlusCircleSmall,
    IconPlusSmall,
    IconPrivateSmall,
    IconProjectPrivate,
    IconProjectPublic,
    IconPublicSmall,
    IconRefresh,
    IconSample,
    IconSamplePrivate,
    IconSamplePublic,
    IconSave,
    IconSearch,
    IconShare,
    IconSubmitArrow,
    IconSuccess,
    IconSuccessSmall,
    IconTableSmall,
    IconTempSmall,
    IconTreeSmall,
    SortIcon,
  },
  FONT_AWESOME: {
    IconArrowRight,
  },
  LOGO: {
    LogoColor,
    LogoMarkColor,
    LogoLockupColor,
  },
  LOGO_REVERSED: {
    CZIDLogoReversed,
    LogoReversed,
    LogoMarkReversed,
    LogoLockupReversed,
  },
};

const icons = Object.values(ICONS_TAXONOMY).reduce((result, components) => {
  return Object.assign(result, components);
}, {});

module.exports = Object.assign(icons, { ICONS_TAXONOMY });
