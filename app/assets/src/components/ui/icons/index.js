import BacteriaCultureIcon from "./BacteriaCultureIcon";
import BannerProjects from "./BannerProjects";
import BannerSamples from "./BannerSamples";
import BannerVisualizations from "./BannerVisualizations";
import CheckmarkIcon from "./CheckmarkIcon";
import CircleCheckmarkIcon from "./CircleCheckmarkIcon";
import CompareIcon from "./CompareIcon";
import CopyIcon from "./CopyIcon";
import FiltersIcon from "./FiltersIcon";
import GlobeIcon from "./GlobeIcon";
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
import IconMinusSmall from "./IconMinusSmall";
import IconPhyloTreeSmall from "./IconPhyloTreeSmall";
import IconPlusSmall from "./IconPlusSmall";
import InfoCircleIcon from "./InfoCircleIcon";
import InfoIcon from "./InfoIcon";
import InfoIconSmall from "./InfoIconSmall";
import InfoPanelIcon from "./InfoPanelIcon";
import InsightIcon from "./InsightIcon";
import LargeDownloadIcon from "./LargeDownloadIcon";
import LockIcon from "./LockIcon";
import LogoColor from "./LogoColor";
import LogoLockupColor from "./LogoLockupColor";
import LogoLockupReversed from "./LogoLockupReversed";
import LogoMarkColor from "./LogoMarkColor";
import LogoMarkReversed from "./LogoMarkReversed";
import LogoReversed from "./LogoReversed";
import PhyloTreeIcon from "./PhyloTreeIcon";
import PhyloTreePrivate from "./PhyloTreePrivate";
import PhyloTreePublic from "./PhyloTreePublic";
import PipelineStageArrowheadIcon from "./PipelineStageArrowheadIcon";
import PlusIcon from "./PlusIcon";
import PrivateProjectIcon from "./PrivateProjectIcon";
import PublicProjectIcon from "./PublicProjectIcon";
import RemoveIcon from "./RemoveIcon";
import SamplePrivateIcon from "./SamplePrivateIcon";
import SamplePublicIcon from "./SamplePublicIcon";
import SaveIcon from "./SaveIcon";
import SortIcon from "./SortIcon";

export const ICONS_TAXONOMY = {
  CUSTOM: {
    BacteriaCultureIcon,
    BannerProjects,
    BannerSamples,
    BannerVisualizations,
    CircleCheckmarkIcon,
    CompareIcon,
    CopyIcon,
    FiltersIcon,
    GlobeIcon,
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
    InfoCircleIcon,
    IconContigSmall,
    IconCoverage,
    IconDownload,
    IconDownloadSmall,
    InfoIconSmall,
    InfoIcon,
    IconMember,
    IconMemberSmall,
    IconMinusSmall,
    InfoPanelIcon,
    IconPlusSmall,
    IconPhyloTreeSmall,
    LargeDownloadIcon,
    LockIcon,
    PhyloTreeIcon,
    PhyloTreePrivate,
    PhyloTreePublic,
    PipelineStageArrowheadIcon,
    PlusIcon,
    PublicProjectIcon,
    PrivateProjectIcon,
    RemoveIcon,
    SamplePrivateIcon,
    SamplePublicIcon,
    SaveIcon,
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
