import Root from './dialog.svelte';
import Content from './dialog-content.svelte';
import Overlay from './dialog-overlay.svelte';
import Portal from './dialog-portal.svelte';
import Close from './dialog-close.svelte';
import { Dialog as DialogPrimitive } from 'bits-ui';

const Trigger = DialogPrimitive.Trigger;

export {
  Root,
  Content,
  Overlay,
  Portal,
  Close,
  Trigger,
  Root as Dialog,
  Content as DialogContent,
  Overlay as DialogOverlay,
  Portal as DialogPortal,
  Close as DialogClose,
  Trigger as DialogTrigger
};
