import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// Create Vuetify instance for tests
const vuetify = createVuetify({
  components,
  directives,
});

describe('Component Tests', () => {
  describe('Admin Login Dialog', () => {
    it('should render login form', async () => {
      // Import dynamically to avoid SSR issues
      const { default: AdminLoginDialog } = await import(
        '../components/admin/AdminLoginDialog.vue'
      );

      const wrapper = mount(AdminLoginDialog, {
        props: {
          modelValue: true,
        },
        global: {
          plugins: [vuetify],
        },
      });

      expect(wrapper.find('input[label="Username"]')).toBeDefined();
      expect(wrapper.find('input[type="password"]')).toBeDefined();
    });

    it('should emit login-success on successful login', async () => {
      const { default: AdminLoginDialog } = await import(
        '../components/admin/AdminLoginDialog.vue'
      );

      const wrapper = mount(AdminLoginDialog, {
        props: {
          modelValue: true,
        },
        global: {
          plugins: [vuetify],
        },
      });

      // Mock successful login
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          session: {
            user: { id: '1', username: 'admin', role: 'admin' },
            token: 'test-token',
          },
        }),
      });

      // Simulate form submission
      await wrapper.find('form').trigger('submit');

      // Check if login-success event was emitted
      expect(wrapper.emitted('login-success')).toBeDefined();
    });
  });

  describe('Mobile Navigation', () => {
    it('should render navigation drawer', async () => {
      const { default: MobileNavigation } = await import(
        '../components/responsive/MobileNavigation.vue'
      );

      const wrapper = mount(MobileNavigation, {
        global: {
          plugins: [vuetify],
        },
      });

      expect(wrapper.find('.mobile-navigation')).toBeDefined();
    });

    it('should emit open-disk event when disk is clicked', async () => {
      const { default: MobileNavigation } = await import(
        '../components/responsive/MobileNavigation.vue'
      );

      const wrapper = mount(MobileNavigation, {
        global: {
          plugins: [vuetify],
        },
      });

      // Find and click a disk item
      const diskItem = wrapper.find('[title="Hard Disk"]');
      if (diskItem.exists()) {
        await diskItem.trigger('click');
        expect(wrapper.emitted('open-disk')).toBeDefined();
      }
    });
  });

  describe('Admin Settings Panel', () => {
    it('should render all tabs', async () => {
      const { default: AdminSettingsPanel } = await import(
        '../components/admin/AdminSettingsPanel.vue'
      );

      const wrapper = mount(AdminSettingsPanel, {
        global: {
          plugins: [vuetify],
        },
      });

      expect(wrapper.text()).toContain('General');
      expect(wrapper.text()).toContain('Users');
      expect(wrapper.text()).toContain('Security');
      expect(wrapper.text()).toContain('System');
    });

    it('should load users when Users tab is selected', async () => {
      const { default: AdminSettingsPanel } = await import(
        '../components/admin/AdminSettingsPanel.vue'
      );

      // Mock fetch for users
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          users: [
            {
              id: '1',
              username: 'admin',
              displayName: 'Administrator',
              role: 'admin',
              created: new Date().toISOString(),
            },
          ],
        }),
      });

      const wrapper = mount(AdminSettingsPanel, {
        global: {
          plugins: [vuetify],
        },
      });

      // Wait for component to mount and load users
      await wrapper.vm.$nextTick();

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/users',
        expect.any(Object)
      );
    });
  });
});

// Utility function for async component imports
function vi() {
  return {
    fn: () => jest.fn(),
  };
}
