import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore, useThemeStore } from '@/stores';
import { PageTree } from './PageTree';
import {
  Search,
  ChevronLeft,
  CheckSquare,
  Trash2,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleSidebarHidden, openCommandPalette } = useUIStore();
  const { theme, toggleTheme } = useThemeStore();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-full flex-col border-r bg-sidebar">
      {/* Header */}
      <div className="flex h-12 flex-shrink-0 items-center justify-between px-3">
        <span className="text-sm font-semibold">
          Notion Todo
        </span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Switch to {theme === 'dark' ? 'light' : 'dark'} mode
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleSidebarHidden}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Hide sidebar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 pb-2">
        <Button
          variant="ghost"
          onClick={openCommandPalette}
          className="w-full justify-start gap-2 px-2 text-muted-foreground"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Ctrl K
          </kbd>
        </Button>
      </div>

      {/* Quick Links */}
      <div className="px-2 pb-2">
        <Button
          variant={isActive('/my-tasks') || isActive('/') ? 'secondary' : 'ghost'}
          onClick={() => navigate('/my-tasks')}
          className="w-full justify-start gap-2 px-2"
        >
          <CheckSquare className="h-4 w-4" />
          <span>My Tasks</span>
        </Button>
      </div>

      {/* Divider */}
      <Separator className="mx-2" />

      {/* Pages Section */}
      <div className="flex-1 overflow-auto px-2 py-2">
        <div className="mb-2 px-2">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            Pages
          </span>
        </div>
        <PageTree />
      </div>

      {/* Bottom Links */}
      <Separator className="mx-2" />
      <div className="flex-shrink-0 px-2 py-2">
        <Button
          variant={isActive('/trash') ? 'secondary' : 'ghost'}
          onClick={() => navigate('/trash')}
          className="w-full justify-start gap-2 px-2"
        >
          <Trash2 className="h-4 w-4" />
          <span>Trash</span>
        </Button>
        <Button
          variant={isActive('/settings') ? 'secondary' : 'ghost'}
          onClick={() => navigate('/settings')}
          className="w-full justify-start gap-2 px-2"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Button>
      </div>
    </div>
  );
}
