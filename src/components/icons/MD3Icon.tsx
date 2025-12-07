import type { ComponentProps, CSSProperties } from 'react'

const ICON_GLYPHS = {
  AccountCircleRounded: 'account_circle',
  AddAPhotoRounded: 'add_a_photo',
  AddPhotoAlternateRounded: 'add_photo_alternate',
  AddRounded: 'add',
  ArrowBackIosNewRounded: 'arrow_back_ios_new',
  ArrowBackRounded: 'arrow_back',
  ArrowForwardIosRounded: 'arrow_forward_ios',
  ArrowForwardRounded: 'arrow_forward',
  ArticleRounded: 'article',
  AttachEmailRounded: 'attach_email',
  BadgeRounded: 'badge',
  BarChartRounded: 'bar_chart',
  CalendarMonthRounded: 'calendar_month',
  CallRounded: 'call',
  CancelRounded: 'cancel',
  CheckBoxOutlineBlankRounded: 'check_box_outline_blank',
  CheckBoxRounded: 'check_box',
  CheckCircleRounded: 'check_circle',
  CheckRounded: 'check',
  ChevronLeftRounded: 'chevron_left',
  ChevronRightRounded: 'chevron_right',
  CloseRounded: 'close',
  CloudDownloadRounded: 'cloud_download',
  CloudUploadRounded: 'cloud_upload',
  DeleteRounded: 'delete',
  DescriptionRounded: 'description',
  DownloadRounded: 'download',
  EditRounded: 'edit',
  ElectricBoltRounded: 'electric_bolt',
  EmailRounded: 'mail',
  EuroRounded: 'euro',
  FilterListRounded: 'filter_list',
  FirstPageRounded: 'first_page',
  ImageRounded: 'image',
  KeyboardArrowDownRounded: 'keyboard_arrow_down',
  KeyboardArrowUpRounded: 'keyboard_arrow_up',
  LastPageRounded: 'last_page',
  MailOutlineRounded: 'mail',
  MailRounded: 'mail',
  MonitorHeartRounded: 'monitor_heart',
  MoreHorizRounded: 'more_horiz',
  MoreVertRounded: 'more_vert',
  PeopleRounded: 'group',
  PhoneRounded: 'phone',
  PhotoCameraRounded: 'photo_camera',
  PictureAsPdfRounded: 'picture_as_pdf',
  PlaceRounded: 'place',
  PrintRounded: 'print',
  RadioButtonCheckedRounded: 'radio_button_checked',
  RadioButtonUncheckedRounded: 'radio_button_unchecked',
  SearchRounded: 'search',
  SellRounded: 'sell',
  SettingsRounded: 'settings',
  UploadFileRounded: 'upload_file',
  UploadRounded: 'upload',
  VisibilityOffOutlined: 'visibility_off',
  VisibilityOutlined: 'visibility',
  VisibilityRounded: 'visibility'
} as const

const ICON_SIZE_MAP = {
  xs: '0.75rem',
  sm: '1rem',
  md: '1.25rem',
  lg: '1.5rem',
  xl: '2rem'
} as const

export type MD3IconName = keyof typeof ICON_GLYPHS

type SizePreset = keyof typeof ICON_SIZE_MAP

export type MD3IconProps = {
  name: MD3IconName
  size?: SizePreset | 'inherit' | number
  fill?: 0 | 1
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700
  grade?: -25 | 0 | 200
  opsz?: 20 | 24 | 40 | 48
} & Omit<ComponentProps<'span'>, 'children'>

const classNames = (...tokens: Array<string | false | undefined>): string =>
  tokens.filter(Boolean).join(' ')

export function MD3Icon({
  name,
  size = 'sm',
  fill = 0,
  weight = 400,
  grade = 0,
  opsz = 24,
  className,
  style,
  'aria-label': ariaLabel,
  ...rest
}: MD3IconProps) {
  const glyph = ICON_GLYPHS[name]
  if (!glyph) {
    throw new Error(`MD3Icon: Unknown icon "${name}"`)
  }

  let fontSize: CSSProperties['fontSize']
  if (size === 'inherit') {
    fontSize = undefined
  } else if (typeof size === 'number') {
    fontSize = `${size}rem`
  } else {
    fontSize = ICON_SIZE_MAP[size]
  }

  return (
    <span
      aria-hidden={ariaLabel ? undefined : true}
      {...rest}
      className={classNames('material-symbols-rounded', className)}
      style={{
        fontSize,
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opsz}`,
        ...style
      }}
    >
      {glyph}
    </span>
  )
}

