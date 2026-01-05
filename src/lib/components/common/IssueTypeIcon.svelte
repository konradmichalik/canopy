<script lang="ts">
  import { Zap, BookOpen, CheckSquare, Bug, ListTodo, FileText } from 'lucide-svelte';
  import type { JiraIssueType } from '../../types';
  import Tooltip from './Tooltip.svelte';

  interface Props {
    issueType: JiraIssueType;
    size?: number;
  }

  let { issueType, size = 16 }: Props = $props();

  // Get icon and color based on issue type
  function getTypeInfo(typeName: string): { color: string } {
    const name = typeName.toLowerCase();

    if (name === 'epic') {
      return { color: '#904EE2' };
    }
    if (name === 'story' || name === 'feature' || name === 'new feature') {
      return { color: '#63BA3C' };
    }
    if (name === 'bug') {
      return { color: '#E5493A' };
    }
    if (name === 'task' || name === 'technical task') {
      return { color: '#4BADE8' };
    }
    if (name.includes('sub-task') || name === 'subtask') {
      return { color: '#4BADE8' };
    }

    return { color: '#6B7280' };
  }

  const typeInfo = $derived(getTypeInfo(issueType.name));
  const typeName = $derived(issueType.name.toLowerCase());
</script>

<Tooltip text={issueType.name}>
  <span class="inline-flex items-center justify-center flex-shrink-0" style="color: {typeInfo.color}">
    {#if typeName === 'epic'}
      <Zap {size} />
    {:else if typeName === 'story' || typeName === 'feature' || typeName === 'new feature'}
      <BookOpen {size} />
    {:else if typeName === 'bug'}
      <Bug {size} />
    {:else if typeName === 'task' || typeName === 'technical task'}
      <CheckSquare {size} />
    {:else if typeName.includes('sub-task') || typeName === 'subtask'}
      <ListTodo {size} />
    {:else}
      <FileText {size} />
    {/if}
  </span>
</Tooltip>
