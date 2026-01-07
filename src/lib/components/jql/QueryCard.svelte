<script lang="ts">
  import AtlaskitIcon from '../common/AtlaskitIcon.svelte';
  import Tooltip from '../common/Tooltip.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import type { SavedQuery } from '../../types';
  import { truncateJql } from '../../utils/jql-helpers';
  import { downloadSingleQuery } from '../../utils/storage';

  interface Props {
    query: SavedQuery;
    onOpen: (query: SavedQuery) => void;
    onEdit: (query: SavedQuery) => void;
    onDelete: (query: SavedQuery) => void;
  }

  let { query, onOpen, onEdit, onDelete }: Props = $props();

  function handleDelete(e: Event): void {
    e.stopPropagation();
    if (confirm(`Delete query "${query.title}"?`)) {
      onDelete(query);
    }
  }

  function handleExport(e: Event): void {
    e.stopPropagation();
    downloadSingleQuery(query);
  }
</script>

<Card.Root
  class="group hover:border-primary transition-colors cursor-pointer"
  onclick={() => onOpen(query)}
  onkeydown={(e) => e.key === 'Enter' && onOpen(query)}
  role="button"
  tabindex={0}
>
  <Card.Header class="pb-2">
    <div class="flex items-start justify-between gap-2">
      <Card.Title class="truncate text-base">{query.title}</Card.Title>
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip text="Edit query">
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7"
            onclick={(e) => {
              e.stopPropagation();
              onEdit(query);
            }}
          >
            <AtlaskitIcon name="edit" size={16} />
          </Button>
        </Tooltip>
        <Tooltip text="Export query">
          <Button variant="ghost" size="icon" class="h-7 w-7" onclick={handleExport}>
            <AtlaskitIcon name="download" size={16} />
          </Button>
        </Tooltip>
        <Tooltip text="Delete query">
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
            onclick={handleDelete}
          >
            <AtlaskitIcon name="delete" size={16} />
          </Button>
        </Tooltip>
      </div>
    </div>
  </Card.Header>

  <Card.Content class="pb-3">
    <p class="text-sm text-muted-foreground font-mono break-all">
      {truncateJql(query.jql, 80)}
    </p>
  </Card.Content>

  <Card.Footer class="justify-between">
    <span class="text-xs text-muted-foreground">
      Updated {new Date(query.updatedAt).toLocaleDateString()}
    </span>
    <Button
      variant="ghost"
      size="sm"
      class="text-primary"
      onclick={(e) => {
        e.stopPropagation();
        onOpen(query);
      }}
    >
      <AtlaskitIcon name="video-play" size={16} />
      Open
    </Button>
  </Card.Footer>
</Card.Root>
