'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { authFetch, isUserAuthenticated } from '@/lib/userAuth'
import { PortfolioSection, SectionType } from '@/types/portfolio'

const SECTION_LABELS: Record<SectionType, string> = {
  HERO: 'Hero',
  ABOUT: 'About',
  EXPERIENCE: 'Experience',
  PROJECTS: 'Projects',
  SKILLS: 'Skills',
  EDUCATION: 'Education',
  CONTACT: 'Contact',
}

export default function PortfolioEditorPage() {
  const [sections, setSections] = useState<PortfolioSection[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loadError, setLoadError] = useState('')

  // PointerSensor has a small activation distance so single-clicks on the
  // drag handle (to expand the card) don't accidentally start a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    if (!isUserAuthenticated()) return
    authFetch('/api/user/portfolio')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed')))
      .then((j) => setSections(j.data?.sections ?? []))
      .catch(() => setLoadError('無法載入作品集內容，請重新整理頁面'))
  }, [])

  function updateData(id: string, data: Record<string, unknown>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, data } : s)))
  }

  function toggleVisible(id: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s))
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSections((prev) => {
      const oldIdx = prev.findIndex((s) => s.id === active.id)
      const newIdx = prev.findIndex((s) => s.id === over.id)
      if (oldIdx === -1 || newIdx === -1) return prev
      const next = arrayMove(prev, oldIdx, newIdx)
      return next.map((s, i) => ({ ...s, order: i }))
    })
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await authFetch('/api/user/portfolio/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          sections.map((s, i) => ({
            type: s.type,
            order: i,
            isVisible: s.isVisible,
            data: s.data,
          }))
        ),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: json.error || 'Failed to save' })
      } else {
        setSections(json.data?.sections ?? sections)
        setMessage({ type: 'success', text: 'Saved successfully' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Portfolio Editor</h1>
          <p className="text-xs text-gray-400 mt-1">拖曳左側把手即可調整區塊順序</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save All'}
        </button>
      </div>

      {loadError && (
        <div className="text-sm rounded-lg px-4 py-3 bg-red-50 border border-red-200 text-red-700">
          {loadError}
        </div>
      )}

      {message && (
        <div
          className={`text-sm rounded-lg px-4 py-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {sections.map((section) => (
              <SortableSectionCard
                key={section.id}
                section={section}
                isExpanded={expanded === section.id}
                onToggleExpand={() =>
                  setExpanded((prev) => (prev === section.id ? null : section.id))
                }
                onToggleVisible={() => toggleVisible(section.id)}
                onUpdateData={(data) => updateData(section.id, data)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableSectionCard({
  section,
  isExpanded,
  onToggleExpand,
  onToggleVisible,
  onUpdateData,
}: {
  section: PortfolioSection
  isExpanded: boolean
  onToggleExpand: () => void
  onToggleVisible: () => void
  onUpdateData: (data: Record<string, unknown>) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Lift the card visually while dragging
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-xl overflow-hidden ${
        section.isVisible ? 'border-gray-200' : 'border-gray-100 opacity-60'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Drag handle — only this element listens for pointer drag events,
            so clicks on the expand/visibility toggles don't start a drag. */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none select-none transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <circle cx="5" cy="3" r="1.25" />
            <circle cx="11" cy="3" r="1.25" />
            <circle cx="5" cy="8" r="1.25" />
            <circle cx="11" cy="8" r="1.25" />
            <circle cx="5" cy="13" r="1.25" />
            <circle cx="11" cy="13" r="1.25" />
          </svg>
        </button>

        <button onClick={onToggleExpand} className="flex-1 text-left">
          <span className="text-sm font-medium text-gray-900">
            {SECTION_LABELS[section.type]}
          </span>
        </button>

        <button
          onClick={onToggleVisible}
          className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:border-gray-300 transition-colors"
        >
          {section.isVisible ? 'Visible' : 'Hidden'}
        </button>

        <button onClick={onToggleExpand} className="text-gray-400 text-xs">
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 px-4 py-4">
          <SectionEditor
            type={section.type}
            data={section.data as Record<string, unknown>}
            onChange={onUpdateData}
          />
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  )
}

function SectionEditor({
  type,
  data,
  onChange,
}: {
  type: SectionType
  data: Record<string, unknown>
  onChange: (d: Record<string, unknown>) => void
}) {
  function set(key: string, value: unknown) {
    onChange({ ...data, [key]: value })
  }
  function str(key: string) {
    return (data[key] as string) || ''
  }

  switch (type) {
    case 'HERO':
      return (
        <div className="space-y-3">
          <Field label="Name" value={str('name')} onChange={(v) => set('name', v)} placeholder="Jane Doe" />
          <Field label="Title / Role" value={str('title')} onChange={(v) => set('title', v)} placeholder="Product Manager" />
          <Field label="Bio" value={str('bio')} onChange={(v) => set('bio', v)} type="textarea" placeholder="Short intro about yourself…" />
          <Field label="Email" value={str('email')} onChange={(v) => set('email', v)} type="email" />
          <Field label="LinkedIn URL" value={str('linkedin')} onChange={(v) => set('linkedin', v)} placeholder="https://linkedin.com/in/…" />
          <Field label="GitHub URL" value={str('github')} onChange={(v) => set('github', v)} placeholder="https://github.com/…" />
          <Field label="Avatar URL" value={str('avatarUrl')} onChange={(v) => set('avatarUrl', v)} placeholder="https://…" />
        </div>
      )

    case 'ABOUT':
      return (
        <Field label="Content" value={str('content')} onChange={(v) => set('content', v)} type="textarea" placeholder="Write about yourself…" />
      )

    case 'EXPERIENCE': {
      type ExpItem = { company: string; role: string; period: string; description: string }
      const items: ExpItem[] = (data.items as ExpItem[]) || []
      function updateItem(i: number, key: keyof ExpItem, v: string) {
        const next = items.map((item, idx) => (idx === i ? { ...item, [key]: v } : item))
        set('items', next)
      }
      function addItem() {
        set('items', [...items, { company: '', role: '', period: '', description: '' }])
      }
      function removeItem(i: number) {
        set('items', items.filter((_, idx) => idx !== i))
      }
      return (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Entry {i + 1}</span>
                <button onClick={() => removeItem(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
              </div>
              <Field label="Role" value={item.role} onChange={(v) => updateItem(i, 'role', v)} placeholder="Senior PM" />
              <Field label="Company" value={item.company} onChange={(v) => updateItem(i, 'company', v)} placeholder="Acme Corp" />
              <Field label="Period" value={item.period} onChange={(v) => updateItem(i, 'period', v)} placeholder="2022 – Present" />
              <Field label="Description" value={item.description} onChange={(v) => updateItem(i, 'description', v)} type="textarea" />
            </div>
          ))}
          <button onClick={addItem} className="text-sm text-blue-500 hover:underline">+ Add entry</button>
        </div>
      )
    }

    case 'PROJECTS': {
      type ProjItem = { title: string; description: string; url: string; tags: string }
      const items: ProjItem[] = ((data.items as Array<{ title: string; description: string; url: string; tags: string[] | string }>) || []).map((p) => ({
        ...p,
        tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
      }))
      function updateItem(i: number, key: keyof ProjItem, v: string) {
        const next = items.map((item, idx) => (idx === i ? { ...item, [key]: v } : item))
        set('items', next.map((p) => ({ ...p, tags: p.tags.split(',').map((t) => t.trim()).filter(Boolean) })))
      }
      function addItem() {
        set('items', [...(data.items as unknown[] || []), { title: '', description: '', url: '', tags: [] }])
      }
      function removeItem(i: number) {
        set('items', (data.items as unknown[] || []).filter((_, idx) => idx !== i))
      }
      return (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Project {i + 1}</span>
                <button onClick={() => removeItem(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
              </div>
              <Field label="Title" value={item.title} onChange={(v) => updateItem(i, 'title', v)} />
              <Field label="Description" value={item.description} onChange={(v) => updateItem(i, 'description', v)} type="textarea" />
              <Field label="URL" value={item.url} onChange={(v) => updateItem(i, 'url', v)} placeholder="https://…" />
              <Field label="Tags (comma-separated)" value={item.tags} onChange={(v) => updateItem(i, 'tags', v)} placeholder="React, TypeScript, AWS" />
            </div>
          ))}
          <button onClick={addItem} className="text-sm text-blue-500 hover:underline">+ Add project</button>
        </div>
      )
    }

    case 'SKILLS': {
      type GroupItem = { name: string; skills: string }
      const groups: GroupItem[] = ((data.groups as Array<{ name: string; skills: string[] | string }>) || []).map((g) => ({
        name: g.name,
        skills: Array.isArray(g.skills) ? g.skills.join(', ') : (g.skills || ''),
      }))
      function updateGroup(i: number, key: keyof GroupItem, v: string) {
        const next = groups.map((g, idx) => (idx === i ? { ...g, [key]: v } : g))
        set('groups', next.map((g) => ({ name: g.name, skills: g.skills.split(',').map((s) => s.trim()).filter(Boolean) })))
      }
      function addGroup() {
        set('groups', [...(data.groups as unknown[] || []), { name: '', skills: [] }])
      }
      function removeGroup(i: number) {
        set('groups', (data.groups as unknown[] || []).filter((_, idx) => idx !== i))
      }
      return (
        <div className="space-y-4">
          {groups.map((group, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Group {i + 1}</span>
                <button onClick={() => removeGroup(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
              </div>
              <Field label="Group Name" value={group.name} onChange={(v) => updateGroup(i, 'name', v)} placeholder="Frontend" />
              <Field label="Skills (comma-separated)" value={group.skills} onChange={(v) => updateGroup(i, 'skills', v)} placeholder="React, TypeScript, Tailwind" />
            </div>
          ))}
          <button onClick={addGroup} className="text-sm text-blue-500 hover:underline">+ Add group</button>
        </div>
      )
    }

    case 'EDUCATION': {
      type EduItem = { school: string; degree: string; period: string }
      const items: EduItem[] = (data.items as EduItem[]) || []
      function updateItem(i: number, key: keyof EduItem, v: string) {
        const next = items.map((item, idx) => (idx === i ? { ...item, [key]: v } : item))
        set('items', next)
      }
      function addItem() {
        set('items', [...items, { school: '', degree: '', period: '' }])
      }
      function removeItem(i: number) {
        set('items', items.filter((_, idx) => idx !== i))
      }
      return (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Degree {i + 1}</span>
                <button onClick={() => removeItem(i)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
              </div>
              <Field label="Degree" value={item.degree} onChange={(v) => updateItem(i, 'degree', v)} placeholder="B.S. Computer Science" />
              <Field label="School" value={item.school} onChange={(v) => updateItem(i, 'school', v)} placeholder="National Taiwan University" />
              <Field label="Period" value={item.period} onChange={(v) => updateItem(i, 'period', v)} placeholder="2016 – 2020" />
            </div>
          ))}
          <button onClick={addItem} className="text-sm text-blue-500 hover:underline">+ Add degree</button>
        </div>
      )
    }

    case 'CONTACT':
      return (
        <div className="space-y-3">
          <Field label="Email" value={str('email')} onChange={(v) => set('email', v)} type="email" />
          <Field label="LinkedIn URL" value={str('linkedin')} onChange={(v) => set('linkedin', v)} placeholder="https://linkedin.com/in/…" />
          <Field label="GitHub URL" value={str('github')} onChange={(v) => set('github', v)} placeholder="https://github.com/…" />
          <Field label="Website URL" value={str('website')} onChange={(v) => set('website', v)} placeholder="https://…" />
        </div>
      )

    default:
      return null
  }
}
