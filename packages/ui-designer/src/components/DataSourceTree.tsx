import React, { useState } from 'react'
import { useDesignerStore } from '../store/index.js'

type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'unknown'

interface FieldNode {
  key: string
  type: FieldType
  children?: FieldNode[]
}

function getFieldType(value: unknown): FieldType {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  switch (typeof value) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'object':
      return 'object'
    default:
      return 'unknown'
  }
}

function buildFieldTree(obj: Record<string, unknown>): FieldNode[] {
  return Object.entries(obj).map(([key, value]) => {
    const type = getFieldType(value)

    if (type === 'array') {
      const arr = value as unknown[]
      // Use first element to infer child structure
      const firstItem = arr[0]
      let children: FieldNode[] | undefined
      if (
        firstItem !== null &&
        firstItem !== undefined &&
        typeof firstItem === 'object' &&
        !Array.isArray(firstItem)
      ) {
        children = buildFieldTree(firstItem as Record<string, unknown>)
      }
      return { key, type, children }
    }

    if (type === 'object' && value !== null) {
      const children = buildFieldTree(value as Record<string, unknown>)
      return { key, type, children }
    }

    return { key, type }
  })
}

const TYPE_ICONS: Record<FieldType, string> = {
  string: 'T',
  number: '#',
  boolean: '?',
  object: '{',
  array: '[',
  null: '0',
  unknown: '*',
}

const TYPE_COLORS: Record<FieldType, string> = {
  string: '#7c7cff',
  number: '#4caf50',
  boolean: '#ff9800',
  object: '#e91e63',
  array: '#00bcd4',
  null: '#888',
  unknown: '#888',
}

interface FieldRowProps {
  node: FieldNode
  depth: number
}

function FieldRow({ node, depth }: FieldRowProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0
  const iconColor = TYPE_COLORS[node.type]
  const icon = TYPE_ICONS[node.type]
  const typeLabel = node.type === 'array' ? `${node.type}[]` : node.type

  return (
    <>
      <div
        onClick={() => hasChildren && setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: `2px 8px 2px ${8 + depth * 12}px`,
          cursor: hasChildren ? 'pointer' : 'default',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.background = '#2d2d3f'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.background = 'transparent'
        }}
      >
        {/* Expand chevron */}
        <span
          style={{
            fontSize: 9,
            color: '#555',
            width: 10,
            flexShrink: 0,
            visibility: hasChildren ? 'visible' : 'hidden',
          }}
        >
          {expanded ? '▼' : '▶'}
        </span>

        {/* Type icon badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 16,
            height: 16,
            borderRadius: 3,
            background: iconColor + '22',
            color: iconColor,
            fontSize: 9,
            fontWeight: 700,
            flexShrink: 0,
            fontFamily: 'monospace',
          }}
        >
          {icon}
        </span>

        {/* Key name */}
        <span
          style={{
            fontSize: 12,
            color: '#ccc',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {node.key}
        </span>

        {/* Type label */}
        <span style={{ fontSize: 10, color: '#555', flexShrink: 0 }}>{typeLabel}</span>
      </div>

      {/* Children */}
      {hasChildren &&
        expanded &&
        node.children!.map((child) => <FieldRow key={child.key} node={child} depth={depth + 1} />)}
    </>
  )
}

export function DataSourceTree() {
  const sampleData = useDesignerStore((s) => s.sampleData)
  const [collapsed, setCollapsed] = useState(false)

  const hasData = Object.keys(sampleData).length > 0
  const fields = hasData ? buildFieldTree(sampleData) : []

  const sectionStyle: React.CSSProperties = {
    borderBottom: '1px solid #3d3d5c',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 12px 8px',
    cursor: 'pointer',
    userSelect: 'none',
  }

  return (
    <div style={sectionStyle}>
      <div
        style={labelStyle}
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? 'Expand data source' : 'Collapse data source'}
      >
        <span>Data Fields</span>
        <span style={{ fontSize: 9, color: '#555' }}>{collapsed ? '▶' : '▼'}</span>
      </div>

      {!collapsed && (
        <div style={{ paddingBottom: 8 }}>
          {!hasData && (
            <div style={{ fontSize: 11, color: '#555', padding: '0 12px 8px' }}>
              No sample data loaded
            </div>
          )}
          {fields.map((node) => (
            <FieldRow key={node.key} node={node} depth={0} />
          ))}
        </div>
      )}
    </div>
  )
}
