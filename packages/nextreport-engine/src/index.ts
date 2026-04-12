// @nextreport/engine — unified reporting engine package
// Re-exports public APIs from all core packages

// Schema — report DSL types and validation
export {
  ReportSchema,
  PageSchema,
  PageSizeSchema,
  OrientationSchema,
  MarginsSchema,
  DataSourceSchema,
  FieldSchema,
  FieldTypeSchema,
  BandSchema,
  BandTypeSchema,
  ComponentSchema,
  TextComponentSchema,
  TableComponentSchema,
  TableColumnSchema,
  PositionSchema,
  getReportJsonSchema,
} from '@nextreport/schema'

export type {
  Report,
  Page as PageConfig,
  PageSize,
  Orientation,
  Margins,
  DataSource,
  Field,
  FieldType,
  Band,
  BandType,
  Component,
  TextComponent,
  TableComponent,
  TableColumn,
  Position,
} from '@nextreport/schema'

// Engine Core — render pipeline
export { renderReport, validateReport } from '@nextreport/engine-core'

export type {
  RenderResult,
  RenderMetadata,
  Page,
  ResolvedElement,
  RenderOptions,
  ValidationResult,
} from '@nextreport/engine-core'

// Renderer HTML — IR to HTML
export { renderToHtml } from '@nextreport/renderer-html'

export type { HtmlRenderOptions } from '@nextreport/renderer-html'

// Renderer PDF — HTML to PDF
export { renderToPdf } from '@nextreport/renderer-pdf'

export type { PdfRenderOptions } from '@nextreport/renderer-pdf'
