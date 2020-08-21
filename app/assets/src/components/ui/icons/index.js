import BacteriaCultureIcon from "./BacteriaCultureIcon";
import BannerProjects from "./BannerProjects";
import BannerSamples from "./BannerSamples";
import BannerVisualizations from "./BannerVisualizations";
import BulletListIcon from "./BulletListIcon";
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
import IconBackgroundModel from "./IconBackgroundModel";
import IconBrowserSmall from "./IconBrowserSmall";
import IconChartSmall from "./IconChartSmall";
import IconContigSmall from "./IconContigSmall";
import IconCoverage from "./IconCoverage";
import IconDownload from "./IconDownload";
import IconDownloadSmall from "./IconDownloadSmall";
import IconPhyloTreeSmall from "./IconPhyloTreeSmall";
import InfoCircleIcon from "./InfoCircleIcon";
import InfoIcon from "./InfoIcon";
import InfoPanelIcon from "./InfoPanelIcon";
import InsightIcon from "./InsightIcon";
import LargeDownloadIcon from "./LargeDownloadIcon";
import LoadingIcon from "./LoadingIcon";
import LockIcon from "./LockIcon";
import LogoColor from "./LogoColor";
import LogoMarkColor from "./LogoMarkColor";
import LogoMarkReversed from "./LogoMarkReversed";
import LogoLockupColor from "./LogoLockupColor";
import LogoLockupReversed from "./LogoLockupReversed";
import LogoReversed from "./LogoReversed";
import MinusControlIcon from "./MinusControlIcon";
import PhyloTreeIcon from "./PhyloTreeIcon";
import PhyloTreePrivate from "./PhyloTreePrivate";
import PhyloTreePublic from "./PhyloTreePublic";
import PipelineStageArrowheadIcon from "./PipelineStageArrowheadIcon";
import PlusControlIcon from "./PlusControlIcon";
import PlusIcon from "./PlusIcon";
import PublicProjectIcon from "./PublicProjectIcon";
import PrivateProjectIcon from "./PrivateProjectIcon";
import RemoveIcon from "./RemoveIcon";
import SamplePrivateIcon from "./SamplePrivateIcon";
import SamplePublicIcon from "./SamplePublicIcon";
import SaveIcon from "./SaveIcon";
import SortIcon from "./SortIcon";
import InfoIconSmall from "./InfoIconSmall";
import UserIcon from "./UserIcon";

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
    IconBackgroundModel,
    IconBrowserSmall,
    IconChartSmall,
    IconContigSmall,
    IconCoverage,
    IconDownload,
    IconDownloadSmall,
    IconPhyloTreeSmall,
    InfoCircleIcon,
    InfoIcon,
    InfoPanelIcon,
    LargeDownloadIcon,
    LockIcon,
    MinusControlIcon,
    PhyloTreeIcon,
    PhyloTreePrivate,
    PhyloTreePublic,
    PipelineStageArrowheadIcon,
    PlusControlIcon,
    PlusIcon,
    PublicProjectIcon,
    PrivateProjectIcon,
    RemoveIcon,
    SamplePrivateIcon,
    SamplePublicIcon,
    SaveIcon,
    InfoIconSmall,
    UserIcon,
  },
  FONT_AWESOME: {
    BulletListIcon,
    CheckmarkIcon,
    GlobeLinedIcon,
    InsightIcon,
    LoadingIcon,
    SortIcon,
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
