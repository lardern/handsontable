import {
  outerWidth
} from '../../helpers/dom/element';
import { registerPlugin } from '../../plugins';
import { rangeEach } from '../../helpers/number';
import BasePlugin from '../_base';

/**
 * @plugin HeaderTooltips
 *
 * @description
 * Allows to add a tooltip to the table headers.
 *
 * Available options:
 * * the `rows` property defines if tooltips should be added to row headers,
 * * the `columns` property defines if tooltips should be added to column headers,
 * * the `onlyTrimmed` property defines if tooltips should be added only to headers, which content is trimmed by the header itself (the content being wider then the header).
 *
 * @example
 * ```js
 * const container = document.getElementById('example');
 * const hot = new Handsontable(container, {
 *   date: getData(),
 *   // enable and configure header tooltips
 *   headerTooltips: {
 *     rows: true,
 *     columns: true,
 *     onlyTrimmed: false
 *   }
 * });
 * ```
 */
class HeaderTooltips extends BasePlugin {
  constructor(hotInstance) {
    super(hotInstance);

    /**
     * Cached plugin settings.
     *
     * @private
     * @type {boolean|object}
     */
    this.settings = null;
  }

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` than the {@link HeaderTooltips#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return !!this.hot.getSettings().headerTooltips;
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin() {
    if (this.enabled) {
      return;
    }

    this.settings = this.hot.getSettings().headerTooltips;

    this.parseSettings();

    this.addHook('afterGetColHeader', (col, TH) => this.onAfterGetHeader(col, TH));
    this.addHook('afterGetRowHeader', (col, TH) => this.onAfterGetHeader(col, TH));

    super.enablePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin() {
    this.settings = null;

    this.clearTitleAttributes();

    super.disablePlugin();
  }

  /**
   * Parses the plugin settings.
   *
   * @private
   */
  parseSettings() {
    if (typeof this.settings === 'boolean') {
      this.settings = {
        rows: true,
        columns: true,
        onlyTrimmed: false
      };
    }
  }

  /**
   * Clears the previously assigned title attributes.
   *
   * @private
   */
  clearTitleAttributes() {
    const headerLevels = this.hot.view.wt.getSetting('columnHeaders').length;
    const mainHeaders = this.hot.view.wt.wtTable.THEAD;
    const topHeaders = this.hot.view.wt.wtOverlays.topOverlay.clone.wtTable.THEAD;
    const topLeftCornerOverlay = this.hot.view.wt.wtOverlays.topLeftCornerOverlay;
    const topLeftCornerHeaders = topLeftCornerOverlay ? topLeftCornerOverlay.clone.wtTable.THEAD : null;

    rangeEach(0, headerLevels - 1, (i) => {
      const masterLevel = mainHeaders.childNodes[i];
      const topLevel = topHeaders.childNodes[i];
      const topLeftCornerLevel = topLeftCornerHeaders ? topLeftCornerHeaders.childNodes[i] : null;

      rangeEach(0, masterLevel.childNodes.length - 1, (j) => {
        masterLevel.childNodes[j].removeAttribute('title');

        if (topLevel && topLevel.childNodes[j]) {
          topLevel.childNodes[j].removeAttribute('title');
        }

        if (topLeftCornerHeaders && topLeftCornerLevel && topLeftCornerLevel.childNodes[j]) {
          topLeftCornerLevel.childNodes[j].removeAttribute('title');
        }
      });
    }, true);
  }

  /**
   * Adds a tooltip to the headers.
   *
   * @private
   * @param {number} index Visual column index.
   * @param {HTMLElement} TH Header's TH element.
   */
  onAfterGetHeader(index, TH) {
    const innerSpan = TH.querySelector('span');
    const isColHeader = TH.parentNode.parentNode.nodeName === 'THEAD';

    if (isColHeader && this.settings.columns || !isColHeader && this.settings.rows) {
      if (this.settings.onlyTrimmed) {
        // const columnWidth = outerWidth(TH);
        const columnWidth = 50;
        /*
        The above line simulates a bug from version 7.x, explained in https://github.com/handsontable/handsontable/issues/6708
        This workaround should be kept until a proper fix, discussed in that issue, is implemented.
        Without the workaround, "onlyTrimmed" does not work in 8.x, because `outerWidth(TH)` always returns 0 in `afterGetColHeader`.
        In 7.x, `outerWidth(TH)` always returned 50 due to that value provided as default in CSS.
        */
        const textWidth = outerWidth(innerSpan);
        
        if (textWidth >= columnWidth && textWidth !== 0) {
          TH.setAttribute('title', innerSpan.textContent);
        }

      } else {
        TH.setAttribute('title', innerSpan.textContent);
      }
    }
  }

  /**
   * Destroys the plugin instance.
   */
  destroy() {
    this.settings = null;

    super.destroy();
  }

}

registerPlugin('headerTooltips', HeaderTooltips);

export default HeaderTooltips;
