import type { CSSProperties } from 'react'

import type { MD3IconName, MD3IconProps } from './MD3Icon'
import { MD3Icon } from './MD3Icon'

type LegacyIconProps = Omit<MD3IconProps, 'name' | 'size'> & {
  fontSize?: 'inherit' | 'small' | 'medium' | 'large'
  sx?: CSSProperties
}

const FONT_SIZE_MAP: Record<'small' | 'medium' | 'large', MD3IconProps['size']> = {
  small: 'sm',
  medium: 'md',
  large: 'lg'
}

function createLegacyIcon(name: MD3IconName) {
  const Icon = ({
    fontSize = 'medium',
    sx,
    style,
    ...rest
  }: LegacyIconProps) => {
    const customFontSize = sx?.fontSize ?? style?.fontSize
    const resolvedSize: MD3IconProps['size'] =
      fontSize === 'inherit' || customFontSize ? 'inherit' : FONT_SIZE_MAP[fontSize] ?? 'md'

    const mergedStyle: CSSProperties = {
      ...(sx ?? {}),
      ...(style ?? {})
    }

    return <MD3Icon name={name} size={resolvedSize} style={mergedStyle} {...rest} />
  }

  Icon.displayName = name
  return Icon
}

export const AccountCircleRounded = createLegacyIcon('AccountCircleRounded')
export const AddAPhotoRounded = createLegacyIcon('AddAPhotoRounded')
export const AddPhotoAlternateRounded = createLegacyIcon('AddPhotoAlternateRounded')
export const AddRounded = createLegacyIcon('AddRounded')
export const ArrowBackIosNewRounded = createLegacyIcon('ArrowBackIosNewRounded')
export const ArrowBackRounded = createLegacyIcon('ArrowBackRounded')
export const ArrowForwardIosRounded = createLegacyIcon('ArrowForwardIosRounded')
export const ArrowForwardRounded = createLegacyIcon('ArrowForwardRounded')
export const ArticleRounded = createLegacyIcon('ArticleRounded')
export const AttachEmailRounded = createLegacyIcon('AttachEmailRounded')
export const BadgeRounded = createLegacyIcon('BadgeRounded')
export const BarChartRounded = createLegacyIcon('BarChartRounded')
export const CalendarMonthRounded = createLegacyIcon('CalendarMonthRounded')
export const CallRounded = createLegacyIcon('CallRounded')
export const CancelRounded = createLegacyIcon('CancelRounded')
export const CheckBoxOutlineBlankRounded = createLegacyIcon('CheckBoxOutlineBlankRounded')
export const CheckBoxRounded = createLegacyIcon('CheckBoxRounded')
export const CheckCircleRounded = createLegacyIcon('CheckCircleRounded')
export const CheckRounded = createLegacyIcon('CheckRounded')
export const ChevronLeftRounded = createLegacyIcon('ChevronLeftRounded')
export const ChevronRightRounded = createLegacyIcon('ChevronRightRounded')
export const CloseRounded = createLegacyIcon('CloseRounded')
export const CloudDownloadRounded = createLegacyIcon('CloudDownloadRounded')
export const CloudUploadRounded = createLegacyIcon('CloudUploadRounded')
export const DeleteRounded = createLegacyIcon('DeleteRounded')
export const DescriptionRounded = createLegacyIcon('DescriptionRounded')
export const DownloadRounded = createLegacyIcon('DownloadRounded')
export const EditRounded = createLegacyIcon('EditRounded')
export const ElectricBoltRounded = createLegacyIcon('ElectricBoltRounded')
export const EmailRounded = createLegacyIcon('EmailRounded')
export const EuroRounded = createLegacyIcon('EuroRounded')
export const FilterListRounded = createLegacyIcon('FilterListRounded')
export const FirstPageRounded = createLegacyIcon('FirstPageRounded')
export const ImageRounded = createLegacyIcon('ImageRounded')
export const KeyboardArrowDownRounded = createLegacyIcon('KeyboardArrowDownRounded')
export const KeyboardArrowUpRounded = createLegacyIcon('KeyboardArrowUpRounded')
export const LastPageRounded = createLegacyIcon('LastPageRounded')
export const MailOutlineRounded = createLegacyIcon('MailOutlineRounded')
export const MailRounded = createLegacyIcon('MailRounded')
export const MonitorHeartRounded = createLegacyIcon('MonitorHeartRounded')
export const MoreHorizRounded = createLegacyIcon('MoreHorizRounded')
export const MoreVertRounded = createLegacyIcon('MoreVertRounded')
export const PeopleRounded = createLegacyIcon('PeopleRounded')
export const PhoneRounded = createLegacyIcon('PhoneRounded')
export const PhotoCameraRounded = createLegacyIcon('PhotoCameraRounded')
export const PictureAsPdfRounded = createLegacyIcon('PictureAsPdfRounded')
export const PlaceRounded = createLegacyIcon('PlaceRounded')
export const PrintRounded = createLegacyIcon('PrintRounded')
export const RadioButtonCheckedRounded = createLegacyIcon('RadioButtonCheckedRounded')
export const RadioButtonUncheckedRounded = createLegacyIcon('RadioButtonUncheckedRounded')
export const SearchRounded = createLegacyIcon('SearchRounded')
export const SellRounded = createLegacyIcon('SellRounded')
export const SettingsRounded = createLegacyIcon('SettingsRounded')
export const UploadFileRounded = createLegacyIcon('UploadFileRounded')
export const UploadRounded = createLegacyIcon('UploadRounded')
export const VisibilityOffOutlined = createLegacyIcon('VisibilityOffOutlined')
export const VisibilityOutlined = createLegacyIcon('VisibilityOutlined')
export const VisibilityRounded = createLegacyIcon('VisibilityRounded')

