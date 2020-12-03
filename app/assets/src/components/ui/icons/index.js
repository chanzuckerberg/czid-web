import BacteriaCultureIcon from "./BacteriaCultureIcon";
import BannerProjects from "./BannerProjects";
import BannerSamples from "./BannerSamples";
import BannerVisualizations from "./BannerVisualizations";
import CheckmarkIcon from "./CheckmarkIcon";
import CompareIcon from "./CompareIcon";
import CopyIcon from "./CopyIcon";
import FiltersIcon from "./FiltersIcon";
import GlobeLinedIcon from "./GlobeLinedIcon";
import HeatmapIcon from "./HeatmapIcon";
import HeatmapPrivate from "./HeatmapPrivate";
import HeatmapPublic from "./HeatmapPublic";
import IconAlert from "./IconAlert";
import IconAlertSmall from "./IconAlertSmall";
import IconAlignmentSmall from "./IconAlignmentSmall";
import IconArrowDownSmall from "./IconArrowDownSmall";
import IconArrowRight from "./IconArrowRight";
import IconArrowUpSmall from "./IconArrowUpSmall";
import IconBackgroundModel from "./IconBackgroundModel";
import IconBrowserSmall from "./IconBrowserSmall";
import IconChartSmall from "./IconChartSmall";
import IconContigSmall from "./IconContigSmall";
import IconCoverage from "./IconCoverage";
import IconDownload from "./IconDownload";
import IconDownloadSmall from "./IconDownloadSmall";
import IconLoading from "./IconLoading";
import IconMember from "./IconMember";
import IconMemberSmall from "./IconMemberSmall";
import IconNextcladeLarge from "./IconNextcladeLarge";
import IconMinusSmall from "./IconMinusSmall";
import IconPhyloTree from "./IconPhyloTree";
import IconPhyloTreePrivate from "./IconPhyloTreePrivate";
import IconPhyloTreePublic from "./IconPhyloTreePublic";
import IconPhyloTreeSmall from "./IconPhyloTreeSmall";
import IconPlusSmall from "./IconPlusSmall";
import IconPrivateSmall from "./IconPrivateSmall";
import IconProjectPrivate from "./IconProjectPrivate";
import IconProjectPublic from "./IconProjectPublic";
import IconPublicSmall from "./IconPublicSmall";
import IconInfo from "./IconInfo";
import IconPlusCircleSmall from "./IconPlusCircleSmall";
import IconRefresh from "./IconRefresh";
import IconSamplePrivate from "./IconSamplePrivate";
import IconSamplePublic from "./IconSamplePublic";
import IconSave from "./IconSave";
import IconSearch from "./IconSearch";
import IconShare from "./IconShare";
import IconSuccess from "./IconSuccess";
import IconSuccessSmall from "./IconSuccessSmall";
import IconTableSmall from "./IconTableSmall";
import IconTreeSmall from "./IconTreeSmall";
import InfoCircleIcon from "./InfoCircleIcon";
import InfoIconSmall from "./InfoIconSmall";
import InfoPanelIcon from "./InfoPanelIcon";
import InsightIcon from "./InsightIcon";
import LargeDownloadIcon from "./LargeDownloadIcon";
import LogoColor from "./LogoColor";
import LogoLockupColor from "./LogoLockupColor";
import LogoLockupReversed from "./LogoLockupReversed";
import LogoMarkColor from "./LogoMarkColor";
import LogoMarkReversed from "./LogoMarkReversed";
import LogoReversed from "./LogoReversed";
import PipelineStageArrowheadIcon from "./PipelineStageArrowheadIcon";
import RemoveIcon from "./RemoveIcon";
import SortIcon from "./SortIcon";

export const ICONS_TAXONOMY = {
  CUSTOM: {
    BacteriaCultureIcon,
    BannerProjects,
    BannerSamples,
    BannerVisualizations,
    CompareIcon,
    CopyIcon,
    FiltersIcon,
    HeatmapIcon,
    HeatmapPrivate,
    HeatmapPublic,
    IconAlert,
    IconAlertSmall,
    IconAlignmentSmall,
    IconArrowDownSmall,
    IconArrowRight,
    IconArrowUpSmall,
    IconBackgroundModel,
    IconBrowserSmall,
    IconChartSmall,
    IconContigSmall,
    IconCoverage,
    IconDownload,
    IconDownloadSmall,
    IconInfo,
    IconMember,
    IconMemberSmall,
    IconMinusSmall,
    IconNextcladeLarge,
    IconPlusSmall,
    IconPhyloTree,
    IconPhyloTreePrivate,
    IconPhyloTreePublic,
    IconPhyloTreeSmall,
    IconPlusCircleSmall,
    IconPrivateSmall,
    IconProjectPrivate,
    IconProjectPublic,
    IconPublicSmall,
    IconRefresh,
    IconSamplePrivate,
    IconSamplePublic,
    IconSave,
    IconSearch,
    IconShare,
    IconSuccess,
    IconSuccessSmall,
    IconTableSmall,
    IconTreeSmall,
    InfoCircleIcon,
    InfoIconSmall,
    InfoPanelIcon,
    LargeDownloadIcon,
    PipelineStageArrowheadIcon,
    RemoveIcon,
    SortIcon,
  },
  FONT_AWESOME: {
    CheckmarkIcon,
    GlobeLinedIcon,
    InsightIcon,
    IconLoading,
    IconArrowRight,
  },
  LOGO: {
    LogoColor,
    LogoMarkColor,
    LogoLockupColor,
  },
  LOGO_REVERSED: {
    LogoReversed,
    LogoMarkReversed,
    LogoLockupReversed,
  },
};

const icons = Object.values(ICONS_TAXONOMY).reduce((result, components) => {
  return Object.assign(result, components);
}, {});

module.exports = Object.assign(icons, { ICONS_TAXONOMY });
