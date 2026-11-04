import { useState, useEffect } from 'react';

interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface TagManagerProps {
  availableTags?: Tag[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onTagCreate?: (name: string, color: string) => void;
  onTagDelete?: (tagId: string) => void;
  maxTags?: number;
  disabled?: boolean;
  showColorPicker?: boolean;
}

const defaultColors = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#6366F1',
  '#14B8A6'
];

function TagManager({
  availableTags = [],
  selectedTags,
  onTagsChange,
  onTagCreate,
  onTagDelete,
  maxTags = 10,
  disabled = false,
  showColorPicker = false
}: TagManagerProps) {
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(defaultColors[0]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterText, setFilterText] = useState('');

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleAddTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      return;
    }
    if (selectedTags.length >= maxTags) {
      alert(`Maximum ${maxTags} tags allowed`);
      return;
    }
    onTagsChange([...selectedTags, tagName]);
  };

  const handleRemoveTag = (tagName: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagName));
  };

  const handleCreateTag = () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName) {
      return;
    }

    if (availableTags.some(tag => tag.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert('Tag already exists');
      return;
    }

    onTagCreate?.(trimmedName, selectedColor);
    handleAddTag(trimmedName);
    setNewTagName('');
    setShowCreateForm(false);
    setSelectedColor(defaultColors[0]);
  };

  const handleDeleteTag = (tagId: string, tagName: string) => {
    if (confirm(`Delete tag "${tagName}"?`)) {
      onTagDelete?.(tagId);
      handleRemoveTag(tagName);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateTag();
    }
  };

  return (
    <div className="tag-manager">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Selected Tags</label>
        <div className="flex flex-wrap gap-2">
          {selectedTags.length === 0 ? (
            <p className="text-gray-500 text-sm">No tags selected</p>
          ) : (
            selectedTags.map(tagName => {
              const tag = availableTags.find(t => t.name === tagName);
              return (
                <span
                  key={tagName}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-white"
                  style={{ backgroundColor: tag?.color || '#6B7280' }}
                >
                  {tagName}
                  {!disabled && (
                    <button
                      onClick={() => handleRemoveTag(tagName)}
                      className="hover:bg-white/20 rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })
          )}
        </div>
        {selectedTags.length >= maxTags && (
          <p className="text-orange-500 text-sm mt-1">Maximum {maxTags} tags reached</p>
        )}
      </div>

      {!disabled && (
        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search tags..."
              className="flex-1 px-3 py-2 border rounded text-sm"
            />
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              + New Tag
            </button>
          </div>

          {showCreateForm && (
            <div className="p-4 bg-gray-50 rounded mb-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter tag name"
                className="w-full px-3 py-2 border rounded mb-2"
                autoFocus
              />

              {showColorPicker && (
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <div className="flex gap-2">
                    {defaultColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedColor === color ? 'border-gray-800' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="px-4 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border rounded text-sm hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {filteredTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => {
                  if (selectedTags.includes(tag.name)) {
                    handleRemoveTag(tag.name);
                  } else {
                    handleAddTag(tag.name);
                  }
                }}
                disabled={selectedTags.length >= maxTags && !selectedTags.includes(tag.name)}
                className={`
                  px-3 py-1.5 rounded-full text-sm flex items-center gap-2
                  ${selectedTags.includes(tag.name) ? 'ring-2 ring-offset-1 ring-blue-500' : ''}
                  ${selectedTags.length >= maxTags && !selectedTags.includes(tag.name) ? 'opacity-50' : ''}
                  hover:shadow-md transition-all
                `}
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  border: `1px solid ${tag.color}`
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                <span>{tag.name}</span>
                {tag.count > 0 && (
                  <span className="text-xs opacity-60">({tag.count})</span>
                )}
                {onTagDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTag(tag.id, tag.name);
                    }}
                    className="hover:bg-red-500/20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                )}
              </button>
            ))}
          </div>

          {filteredTags.length === 0 && (
            <p className="text-gray-500 text-sm">No tags found</p>
          )}
        </div>
      )}
    </div>
  );
}

interface TagCloudProps {
  tags: Tag[];
  onTagClick?: (tagName: string) => void;
  selectedTag?: string;
  maxDisplay?: number;
}

function TagCloud({ tags, onTagClick, selectedTag, maxDisplay = 20 }: TagCloudProps) {
  const sortedTags = [...tags].sort((a, b) => b.count - a.count).slice(0, maxDisplay);
  const maxCount = Math.max(...sortedTags.map(t => t.count));

  const getFontSize = (count: number) => {
    const ratio = count / maxCount;
    return 0.75 + ratio * 0.75;
  };

  return (
    <div className="tag-cloud">
      <h3 className="text-sm font-medium mb-2">Popular Tags</h3>
      <div className="flex flex-wrap gap-2">
        {sortedTags.map(tag => (
          <button
            key={tag.id}
            onClick={() => onTagClick?.(tag.name)}
            className={`
              px-2 py-1 rounded-full transition-all hover:shadow-md
              ${selectedTag === tag.name ? 'ring-2 ring-offset-1 ring-blue-500' : ''}
            `}
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color,
              fontSize: `${getFontSize(tag.count)}rem`
            }}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export { TagManager, TagCloud };
export default TagManager;
