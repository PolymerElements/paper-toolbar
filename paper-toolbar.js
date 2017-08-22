import '../polymer/polymer.js';
import '../paper-styles/default-theme.js';
import '../paper-styles/typography.js';
import '../iron-flex-layout/iron-flex-layout.js';
import { Polymer } from '../polymer/lib/legacy/polymer-fn.js';
import { flush, dom } from '../polymer/lib/legacy/polymer.dom.js';
Polymer({
  _template: `
    <style>
      :host {
        --calculated-paper-toolbar-height: var(--paper-toolbar-height, 64px);
        --calculated-paper-toolbar-sm-height: var(--paper-toolbar-sm-height, 56px);
        display: block;
        position: relative;
        box-sizing: border-box;
        -moz-box-sizing: border-box;
        height: var(--calculated-paper-toolbar-height);
        background: var(--paper-toolbar-background, var(--primary-color));
        color: var(--paper-toolbar-color, var(--dark-theme-text-color));
        @apply --paper-toolbar;
      }

      :host(.animate) {
        transition: var(--paper-toolbar-transition, height 0.18s ease-in);
      }

      :host(.medium-tall) {
        height: calc(var(--calculated-paper-toolbar-height) * 2);
        @apply --paper-toolbar-medium;
      }

      :host(.tall) {
        height: calc(var(--calculated-paper-toolbar-height) * 3);
        @apply --paper-toolbar-tall;
      }

      .toolbar-tools {
        position: relative;
        height: var(--calculated-paper-toolbar-height);
        padding: 0 16px;
        pointer-events: none;
        @apply --layout-horizontal;
        @apply --layout-center;
        @apply --paper-toolbar-content;
      }

      /*
       * TODO: Where should media query breakpoints live so they can be shared between elements?
       */

      @media (max-width: 600px) {
        :host {
          height: var(--calculated-paper-toolbar-sm-height);
        }

        :host(.medium-tall) {
          height: calc(var(--calculated-paper-toolbar-sm-height) * 2);
        }

        :host(.tall) {
          height: calc(var(--calculated-paper-toolbar-sm-height) * 3);
        }

        .toolbar-tools {
          height: var(--calculated-paper-toolbar-sm-height);
        }
      }

      #topBar {
        position: relative;
      }

      /* middle bar */
      #middleBar {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
      }

      :host(.tall) #middleBar,
      :host(.medium-tall) #middleBar {
        -webkit-transform: translateY(100%);
        transform: translateY(100%);
      }

      /* bottom bar */
      #bottomBar {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
      }

      /*
       * make elements (e.g. buttons) respond to mouse/touch events
       *
       * \`.toolbar-tools\` disables touch events so multiple toolbars can stack and not
       * absorb events. All children must have pointer events re-enabled to work as
       * expected.
       */
      .toolbar-tools > ::slotted(*:not([disabled])) {
        pointer-events: auto;
      }

      .toolbar-tools > ::slotted(.title) {
        @apply --paper-font-common-base;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 20px;
        font-weight: 400;
        line-height: 1;
        pointer-events: none;
        @apply --layout-flex;
      }

      .toolbar-tools > ::slotted(.title) {
        margin-left: 56px;
      }

      .toolbar-tools > ::slotted(paper-icon-button + .title) {
        margin-left: 0;
      }

      /**
       * The --paper-toolbar-title mixin is applied here instead of above to
       * fix the issue with margin-left being ignored due to css ordering.
       */
      .toolbar-tools > ::slotted(.title) {
        @apply --paper-toolbar-title;
      }

      .toolbar-tools > ::slotted(paper-icon-button[icon=menu]) {
        margin-right: 24px;
      }

      .toolbar-tools > ::slotted(.fit) {
        position: absolute;
        top: auto;
        right: 0;
        bottom: 0;
        left: 0;
        width: auto;
        margin: 0;
      }

      /* TODO(noms): Until we have a better solution for classes that don't use
       * /deep/ create our own.
       */
      .start-justified {
        @apply --layout-start-justified;
      }

      .center-justified {
        @apply --layout-center-justified;
      }

      .end-justified {
        @apply --layout-end-justified;
      }

      .around-justified {
        @apply --layout-around-justified;
      }

      .justified {
        @apply --layout-justified;
      }
    </style>

    <div id="topBar" class\$="toolbar-tools [[_computeBarExtraClasses(justify)]]">
      <slot name="top"></slot>
    </div>

    <div id="middleBar" class\$="toolbar-tools [[_computeBarExtraClasses(middleJustify)]]">
      <slot name="middle"></slot>
    </div>

    <div id="bottomBar" class\$="toolbar-tools [[_computeBarExtraClasses(bottomJustify)]]">
      <slot name="bottom"></slot>
    </div>
`,

  is: 'paper-toolbar',

  hostAttributes: {
    'role': 'toolbar'
  },

  properties: {
    /**
     * Controls how the items are aligned horizontally when they are placed
     * at the bottom.
     * Options are `start`, `center`, `end`, `justified` and `around`.
     */
    bottomJustify: {
      type: String,
      value: ''
    },

    /**
     * Controls how the items are aligned horizontally.
     * Options are `start`, `center`, `end`, `justified` and `around`.
     */
    justify: {
      type: String,
      value: ''
    },

    /**
     * Controls how the items are aligned horizontally when they are placed
     * in the middle.
     * Options are `start`, `center`, `end`, `justified` and `around`.
     */
    middleJustify: {
      type: String,
      value: ''
    }

  },

  ready: function() {
    console.warn(this.is, 'is deprecated. Please use app-layout instead!');
  },

  attached: function() {
    this._observer = this._observe(this);
    this._updateAriaLabelledBy();
  },

  detached: function() {
    if (this._observer) {
      this._observer.disconnect();
    }
  },

  _observe: function(node) {
    var observer = new MutationObserver(function() {
      this._updateAriaLabelledBy();
    }.bind(this));
    observer.observe(node, {
      childList: true,
      subtree: true
    });
    return observer;
  },

  _updateAriaLabelledBy: function() {
    flush();
    var labelledBy = [];
    var contents = Array.prototype.slice
        .call(dom(this.root).querySelectorAll('slot'))
        .concat(Array.prototype.slice.call(dom(this.root).querySelectorAll('content')));

    for (var content, index = 0; content = contents[index]; index++) {
      var nodes = dom(content).getDistributedNodes();
      for (var node, jndex = 0; node = nodes[jndex]; jndex++) {
        if (node.classList && node.classList.contains('title')) {
          if (node.id) {
            labelledBy.push(node.id);
          } else {
            var id = 'paper-toolbar-label-' + Math.floor(Math.random() * 10000);
            node.id = id;
            labelledBy.push(id);
          }
        }
      }
    }
    if (labelledBy.length > 0) {
      this.setAttribute('aria-labelledby', labelledBy.join(' '));
    }
  },

  _computeBarExtraClasses: function(barJustify) {
    if (!barJustify) return '';
    return barJustify + (barJustify === 'justified' ? '' : '-justified');
  }
});
