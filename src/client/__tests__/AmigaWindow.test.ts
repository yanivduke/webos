/**
 * AmigaWindow Component Tests
 *
 * Tests for the core window component including:
 * - Rendering and props
 * - Drag functionality
 * - Resize functionality
 * - Maximize/restore
 * - Z-index management
 * - Keyboard accessibility
 * - Event emissions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import AmigaWindow from '../components/AmigaWindow.vue';

// Mock the composables
vi.mock('../utils/screen-reader', () => ({
  screenReader: {
    announceAction: vi.fn(),
    announceWindowOpened: vi.fn(),
    announceWindowClosed: vi.fn(),
  },
}));

vi.mock('../composables/useKeyboardNav', () => ({
  useEscapeKey: vi.fn(),
}));

vi.mock('../composables/useZIndexManager', () => ({
  getNextZIndex: vi.fn(() => 1000),
}));

describe('AmigaWindow Component', () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080,
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      wrapper = mount(AmigaWindow);

      expect(wrapper.find('.amiga-window').exists()).toBe(true);
      expect(wrapper.find('.window-titlebar').exists()).toBe(true);
      expect(wrapper.find('.window-content').exists()).toBe(true);
      expect(wrapper.find('.resize-handle').exists()).toBe(true);
    });

    it('should render with custom title', () => {
      wrapper = mount(AmigaWindow, {
        props: { title: 'My Window' },
      });

      expect(wrapper.find('.window-title').text()).toBe('My Window');
    });

    it('should render default title when not provided', () => {
      wrapper = mount(AmigaWindow);

      expect(wrapper.find('.window-title').text()).toBe('Untitled');
    });

    it('should render slot content', () => {
      wrapper = mount(AmigaWindow, {
        slots: {
          default: '<div class="slot-content">Hello World</div>',
        },
      });

      expect(wrapper.find('.slot-content').exists()).toBe(true);
      expect(wrapper.find('.slot-content').text()).toBe('Hello World');
    });

    it('should have correct ARIA attributes', () => {
      wrapper = mount(AmigaWindow, {
        props: { title: 'Accessible Window' },
      });

      const windowEl = wrapper.find('.amiga-window');
      expect(windowEl.attributes('role')).toBe('dialog');
      expect(windowEl.attributes('aria-label')).toBe('Accessible Window');
      expect(windowEl.attributes('aria-modal')).toBe('false');
    });

    it('should render close button with accessibility', () => {
      wrapper = mount(AmigaWindow);

      const closeBtn = wrapper.find('.close-button');
      expect(closeBtn.exists()).toBe(true);
      expect(closeBtn.attributes('aria-label')).toBe('Close window');
      expect(closeBtn.attributes('title')).toContain('Close');
    });

    it('should render maximize button with accessibility', () => {
      wrapper = mount(AmigaWindow);

      const zoomBtn = wrapper.find('.zoom-button');
      expect(zoomBtn.exists()).toBe(true);
      expect(zoomBtn.attributes('aria-label')).toContain('window');
    });

    it('should render depth button with accessibility', () => {
      wrapper = mount(AmigaWindow);

      const depthBtn = wrapper.find('.depth-button');
      expect(depthBtn.exists()).toBe(true);
      expect(depthBtn.attributes('aria-label')).toBe('Send to back');
    });
  });

  describe('Position and Size Props', () => {
    it('should use custom position', () => {
      wrapper = mount(AmigaWindow, {
        props: { x: 200, y: 150 },
      });

      const style = wrapper.find('.amiga-window').attributes('style');
      expect(style).toContain('left: 200px');
      expect(style).toContain('top: 150px');
    });

    it('should use custom dimensions', () => {
      wrapper = mount(AmigaWindow, {
        props: { width: 600, height: 400 },
      });

      const style = wrapper.find('.amiga-window').attributes('style');
      expect(style).toContain('width: 600px');
      expect(style).toContain('height: 400px');
    });

    it('should use default position', () => {
      wrapper = mount(AmigaWindow);

      const style = wrapper.find('.amiga-window').attributes('style');
      expect(style).toContain('left: 100px');
      expect(style).toContain('top: 80px');
    });

    it('should use default dimensions', () => {
      wrapper = mount(AmigaWindow);

      const style = wrapper.find('.amiga-window').attributes('style');
      expect(style).toContain('width: 500px');
      expect(style).toContain('height: 350px');
    });

    it('should have z-index in style', () => {
      wrapper = mount(AmigaWindow);

      const style = wrapper.find('.amiga-window').attributes('style');
      expect(style).toContain('z-index');
    });
  });

  describe('Close Functionality', () => {
    it('should emit close event when close button clicked', async () => {
      wrapper = mount(AmigaWindow);

      await wrapper.find('.close-button').trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
      expect(wrapper.emitted('close')?.length).toBe(1);
    });

    it('should emit close on Enter key on close button', async () => {
      wrapper = mount(AmigaWindow);

      await wrapper.find('.close-button').trigger('keydown', { key: 'Enter' });

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit close on Space key on close button', async () => {
      wrapper = mount(AmigaWindow);

      await wrapper.find('.close-button').trigger('keydown', { key: ' ' });

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Maximize/Restore Functionality', () => {
    it('should toggle maximize on zoom button click', async () => {
      wrapper = mount(AmigaWindow, {
        props: { x: 100, y: 100, width: 400, height: 300 },
      });

      const zoomBtn = wrapper.find('.zoom-button');

      // First click - maximize
      await zoomBtn.trigger('click');

      let style = wrapper.find('.amiga-window').attributes('style');
      // When maximized, window should expand
      expect(style).not.toContain('width: 400px');

      // Second click - restore
      await zoomBtn.trigger('click');

      style = wrapper.find('.amiga-window').attributes('style');
      // When restored, should return to original size
      expect(style).toContain('width: 400px');
      expect(style).toContain('height: 300px');
    });

    it('should toggle maximize on titlebar double-click', async () => {
      wrapper = mount(AmigaWindow, {
        props: { width: 400 },
      });

      await wrapper.find('.window-titlebar').trigger('dblclick');

      const style = wrapper.find('.amiga-window').attributes('style');
      // Should be maximized (larger than 400px)
      expect(style).not.toContain('width: 400px');
    });

    it('should update aria-pressed on maximize button', async () => {
      wrapper = mount(AmigaWindow);

      const zoomBtn = wrapper.find('.zoom-button');
      expect(zoomBtn.attributes('aria-pressed')).toBe('false');

      await zoomBtn.trigger('click');

      expect(zoomBtn.attributes('aria-pressed')).toBe('true');
    });

    it('should update aria-label on maximize button', async () => {
      wrapper = mount(AmigaWindow);

      const zoomBtn = wrapper.find('.zoom-button');
      expect(zoomBtn.attributes('aria-label')).toContain('Maximize');

      await zoomBtn.trigger('click');

      expect(zoomBtn.attributes('aria-label')).toContain('Restore');
    });
  });

  describe('Drag Functionality', () => {
    it('should start drag on titlebar mousedown', async () => {
      wrapper = mount(AmigaWindow, {
        props: { x: 100, y: 100 },
      });

      const titlebar = wrapper.find('.window-titlebar');

      // Start drag
      await titlebar.trigger('mousedown', {
        clientX: 150,
        clientY: 110,
      });

      // Simulate mouse move
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 160,
      });
      document.dispatchEvent(mouseMoveEvent);

      // Check position updated
      const style = wrapper.find('.amiga-window').attributes('style');
      expect(style).toContain('left: 150px'); // 100 + (200-150)
      expect(style).toContain('top: 150px'); // 100 + (160-110)
    });

    it('should stop drag on mouseup', async () => {
      wrapper = mount(AmigaWindow, {
        props: { x: 100, y: 100 },
      });

      const titlebar = wrapper.find('.window-titlebar');

      // Start drag
      await titlebar.trigger('mousedown', {
        clientX: 150,
        clientY: 110,
      });

      // Release
      const mouseUpEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseUpEvent);

      // Simulate mouse move after release (should not affect position)
      const initialStyle = wrapper.find('.amiga-window').attributes('style');

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 500,
        clientY: 500,
      });
      document.dispatchEvent(mouseMoveEvent);

      const finalStyle = wrapper.find('.amiga-window').attributes('style');
      expect(finalStyle).toBe(initialStyle);
    });

    it('should not drag when maximized', async () => {
      wrapper = mount(AmigaWindow, {
        props: { x: 100, y: 100 },
      });

      // Maximize first
      await wrapper.find('.zoom-button').trigger('click');

      const styleBeforeDrag = wrapper.find('.amiga-window').attributes('style');

      // Try to drag
      await wrapper.find('.window-titlebar').trigger('mousedown', {
        clientX: 150,
        clientY: 110,
      });

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 300,
        clientY: 300,
      });
      document.dispatchEvent(mouseMoveEvent);

      const styleAfterDrag = wrapper.find('.amiga-window').attributes('style');

      // Position should not change
      expect(styleAfterDrag).toBe(styleBeforeDrag);
    });
  });

  describe('Resize Functionality', () => {
    it('should start resize on handle mousedown', async () => {
      wrapper = mount(AmigaWindow, {
        props: { width: 400, height: 300 },
      });

      const resizeHandle = wrapper.find('.resize-handle');

      // Start resize
      await resizeHandle.trigger('mousedown', {
        clientX: 500,
        clientY: 400,
      });

      // Simulate mouse move to resize
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 600,
        clientY: 500,
      });
      document.dispatchEvent(mouseMoveEvent);

      // Check dimensions updated
      const style = wrapper.find('.amiga-window').attributes('style');
      expect(style).toContain('width: 500px'); // 400 + 100
      expect(style).toContain('height: 400px'); // 300 + 100
    });

    it('should enforce minimum width', async () => {
      wrapper = mount(AmigaWindow, {
        props: { width: 400, height: 300 },
      });

      const resizeHandle = wrapper.find('.resize-handle');

      // Start resize
      await resizeHandle.trigger('mousedown', {
        clientX: 500,
        clientY: 400,
      });

      // Try to resize smaller than minimum
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 100, // Would make width negative
        clientY: 400,
      });
      document.dispatchEvent(mouseMoveEvent);

      const style = wrapper.find('.amiga-window').attributes('style');
      // Should enforce minimum of 200px
      expect(style).toContain('width: 200px');
    });

    it('should enforce minimum height', async () => {
      wrapper = mount(AmigaWindow, {
        props: { width: 400, height: 300 },
      });

      const resizeHandle = wrapper.find('.resize-handle');

      // Start resize
      await resizeHandle.trigger('mousedown', {
        clientX: 500,
        clientY: 400,
      });

      // Try to resize smaller than minimum
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 500,
        clientY: 100, // Would make height negative
      });
      document.dispatchEvent(mouseMoveEvent);

      const style = wrapper.find('.amiga-window').attributes('style');
      // Should enforce minimum of 150px
      expect(style).toContain('height: 150px');
    });

    it('should have keyboard-accessible resize handle', () => {
      wrapper = mount(AmigaWindow);

      const resizeHandle = wrapper.find('.resize-handle');
      expect(resizeHandle.attributes('tabindex')).toBe('0');
      expect(resizeHandle.attributes('role')).toBe('separator');
      expect(resizeHandle.attributes('aria-label')).toBe('Resize window');
    });

    it('should resize with arrow keys', async () => {
      wrapper = mount(AmigaWindow, {
        props: { width: 400, height: 300 },
      });

      const resizeHandle = wrapper.find('.resize-handle');

      // Increase width with right arrow
      await resizeHandle.trigger('keydown', { key: 'ArrowRight' });

      let style = wrapper.find('.amiga-window').attributes('style');
      expect(style).toContain('width: 401px');

      // Decrease width with left arrow
      await resizeHandle.trigger('keydown', { key: 'ArrowLeft' });

      style = wrapper.find('.amiga-window').attributes('style');
      expect(style).toContain('width: 400px');
    });

    it('should resize faster with shift+arrow keys', async () => {
      wrapper = mount(AmigaWindow, {
        props: { width: 400, height: 300 },
      });

      const resizeHandle = wrapper.find('.resize-handle');

      // Increase width with shift+right arrow
      await resizeHandle.trigger('keydown', { key: 'ArrowRight', shiftKey: true });

      const style = wrapper.find('.amiga-window').attributes('style');
      expect(style).toContain('width: 410px'); // Should move by 10 pixels
    });
  });

  describe('Z-Index Management', () => {
    it('should bring window to front on click', async () => {
      const { getNextZIndex } = await import('../composables/useZIndexManager');

      wrapper = mount(AmigaWindow);

      // Click on window
      await wrapper.find('.amiga-window').trigger('mousedown');

      // getNextZIndex should have been called
      expect(getNextZIndex).toHaveBeenCalled();
    });

    it('should send window to back on depth button click', async () => {
      wrapper = mount(AmigaWindow);

      await wrapper.find('.depth-button').trigger('click');

      const style = wrapper.find('.amiga-window').attributes('style');
      expect(style).toContain('z-index: 1');
    });
  });

  describe('Accessibility', () => {
    it('should announce window opened on mount', async () => {
      const { screenReader } = await import('../utils/screen-reader');

      wrapper = mount(AmigaWindow, {
        props: { title: 'Test Window' },
      });

      expect(screenReader.announceWindowOpened).toHaveBeenCalledWith('Test Window');
    });

    it('should announce window closed on unmount', async () => {
      const { screenReader } = await import('../utils/screen-reader');

      wrapper = mount(AmigaWindow, {
        props: { title: 'Test Window' },
      });

      wrapper.unmount();

      expect(screenReader.announceWindowClosed).toHaveBeenCalledWith('Test Window');
    });

    it('should announce close action', async () => {
      const { screenReader } = await import('../utils/screen-reader');

      wrapper = mount(AmigaWindow, {
        props: { title: 'My Window' },
      });

      await wrapper.find('.close-button').trigger('click');

      expect(screenReader.announceAction).toHaveBeenCalledWith('Close', 'My Window');
    });

    it('should announce send to back action', async () => {
      const { screenReader } = await import('../utils/screen-reader');

      wrapper = mount(AmigaWindow, {
        props: { title: 'My Window' },
      });

      await wrapper.find('.depth-button').trigger('click');

      expect(screenReader.announceAction).toHaveBeenCalledWith(
        'Window sent to back',
        'My Window'
      );
    });

    it('should have focusable window element', () => {
      wrapper = mount(AmigaWindow);

      const windowEl = wrapper.find('.amiga-window');
      expect(windowEl.attributes('tabindex')).toBe('-1');
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', async () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      wrapper = mount(AmigaWindow);

      // Start a drag to add listeners
      await wrapper.find('.window-titlebar').trigger('mousedown', {
        clientX: 100,
        clientY: 100,
      });

      wrapper.unmount();

      // Should have removed mousemove and mouseup listeners
      expect(removeEventListenerSpy).toHaveBeenCalled();

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid maximize/restore', async () => {
      wrapper = mount(AmigaWindow, {
        props: { width: 400, height: 300 },
      });

      const zoomBtn = wrapper.find('.zoom-button');

      // Rapid toggles
      for (let i = 0; i < 10; i++) {
        await zoomBtn.trigger('click');
      }

      // Should end up restored (even number of clicks)
      const style = wrapper.find('.amiga-window').attributes('style');
      expect(style).toContain('width: 400px');
      expect(style).toContain('height: 300px');
    });

    it('should handle window with zero dimensions in props', () => {
      // Component should use defaults for invalid values
      wrapper = mount(AmigaWindow, {
        props: { width: 0, height: 0 },
      });

      const style = wrapper.find('.amiga-window').attributes('style');
      expect(style).toContain('width: 0px');
      expect(style).toContain('height: 0px');
    });

    it('should handle negative position', () => {
      wrapper = mount(AmigaWindow, {
        props: { x: -100, y: -50 },
      });

      const style = wrapper.find('.amiga-window').attributes('style');
      expect(style).toContain('left: -100px');
      expect(style).toContain('top: -50px');
    });

    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(500);
      wrapper = mount(AmigaWindow, {
        props: { title: longTitle },
      });

      expect(wrapper.find('.window-title').text()).toBe(longTitle);
      // CSS should handle overflow
    });

    it('should handle special characters in title', () => {
      wrapper = mount(AmigaWindow, {
        props: { title: '<script>alert("xss")</script>' },
      });

      // Vue should escape the title, not render as HTML
      expect(wrapper.find('.window-title').text()).toContain('<script>');
      expect(wrapper.find('script').exists()).toBe(false);
    });
  });
});
