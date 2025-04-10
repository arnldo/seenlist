"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SortDesc, Eye, EyeOff } from "lucide-react"

export type SortOption = {
  label: string
  value: string
  sortFn: (a: any, b: any) => number
}

interface ListControlsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  sortOption: string
  setSortOption: (option: string) => void
  sortOptions: SortOption[]
  isMultiSelectMode: boolean
  toggleMultiSelectMode: () => void
  selectedItems: string[]
  onMarkWatched: (watched: boolean) => void
  onSelectAll: () => void
  onClearSelection: () => void
}

export function ListControls({
  activeTab,
  setActiveTab,
  sortOption,
  setSortOption,
  sortOptions,
  isMultiSelectMode,
  toggleMultiSelectMode,
  selectedItems,
  onMarkWatched,
  onSelectAll,
  onClearSelection,
}: ListControlsProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-purple-400">Your Collection</h2>
        <div className="flex items-center gap-2">
          {/* Multi-select toggle button */}
          <Button
            variant={isMultiSelectMode ? "default" : "outline"}
            size="sm"
            className={isMultiSelectMode ? "bg-purple-600 text-white" : "bg-gray-700 border-gray-600 text-white"}
            onClick={toggleMultiSelectMode}
          >
            {isMultiSelectMode ? "Exit Selection" : "Select"}
          </Button>

          {/* Multi-select actions */}
          {isMultiSelectMode && selectedItems.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-700 border-gray-600 text-white"
                onClick={() => onMarkWatched(true)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Watch
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-700 border-gray-600 text-white"
                onClick={() => onMarkWatched(false)}
              >
                <EyeOff className="h-4 w-4 mr-1" />
                Unwatch
              </Button>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-gray-800">
              <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 text-white">
                All
              </TabsTrigger>
              <TabsTrigger value="watched" className="data-[state=active]:bg-purple-600 text-white">
                Watched
              </TabsTrigger>
              <TabsTrigger value="unwatched" className="data-[state=active]:bg-purple-600 text-white">
                Unwatched
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-gray-700 border-gray-600 text-white">
                <SortDesc className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white max-h-[300px] overflow-y-auto">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  className={`${
                    sortOption === option.value ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
                  } cursor-pointer`}
                  onClick={() => setSortOption(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Multi-select info bar */}
      {isMultiSelectMode && (
        <div className="bg-gray-750 p-2 rounded-lg mb-4 flex justify-between items-center">
          <div className="text-gray-300 text-sm">{selectedItems.length} selected</div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={onSelectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={onClearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
