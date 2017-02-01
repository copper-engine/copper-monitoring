/* ============
 * Panel Component
 * ============
 *
 * A basic panel component.
 *
 * Gives an idea how components work.
 */

import slotMixin from './../../mixins/slot';

export default {
  mixins: [
    slotMixin,
  ],
  props: {
    contextualStyle: {
      type: String,
      required: false,
    },
  },
  computed: {
    classNames() {
      const classNames = ['card'];
      return classNames;
    },
  },
};
