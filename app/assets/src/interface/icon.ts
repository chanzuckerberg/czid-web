export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export interface IconAlertProps extends IconProps {
  type?: IconAlertType;
}
export type IconAlertType = "info" | "warning" | "error" | "inProgress";

export interface IconClickProps extends IconProps {
  onClick?: $TSFixMeFunction;
}

export interface IconTooltipProps extends IconProps {
  tooltip?: string;
}

export interface IconTextProps extends IconProps {
  text?: string;
}

export interface IconSortProps extends IconProps {
  sortDirection?: string;
}
