import validatePadding from "../helpers/validatePadding";
import getPadding from "../helpers/getPadding";

import TrendChartGrid from "./trend-chart-grid";
import TrendChartLabels from "./trend-chart-labels";
import TrendChartCurve from "./trend-chart-curve";

export default {
  name: "TrendChart",
  components: { TrendChartGrid, TrendChartLabels, TrendChartCurve },
  props: {
    datasets: {
      required: true,
      type: Array
    },
    grid: {
      default: null,
      type: Object
    },
    labels: {
      default: null,
      type: Object
    },
    max: {
      type: Number
    },
    min: {
      type: Number
    },
    padding: {
      default: "5",
      type: String,
      validator(val) {
        return validatePadding(val);
      }
    }
  },
  data() {
    return {
      width: null,
      height: null,
      labelsOverflowObject: { top: 0, right: 0, bottom: 0, left: 0 }
    };
  },
  computed: {
    paddingObject() {
      if (!this.padding) return getPadding("0");
      return getPadding(this.padding);
    },
    gridPaddingObject() {
      if (!this.grid || !this.grid.padding) return getPadding("0");
      return getPadding(this.grid.padding);
    },
    boundary() {
      const {
        width,
        height,
        paddingObject,
        gridPaddingObject,
        labelsOverflowObject
      } = this;
      const boundary = {
        minX:
          paddingObject.left +
          gridPaddingObject.left +
          labelsOverflowObject.left,
        minY:
          paddingObject.top + gridPaddingObject.top + labelsOverflowObject.top,
        maxX:
          width -
          paddingObject.right -
          gridPaddingObject.right -
          labelsOverflowObject.right,
        maxY:
          height -
          paddingObject.bottom -
          gridPaddingObject.bottom -
          labelsOverflowObject.bottom
      };
      return boundary;
    },
    params() {
      let maxValue = -Infinity;
      let minValue = Infinity;
      let maxAmount = 0;
      this.datasets.forEach(dataset => {
        let dataArr = dataset.data.map(item =>
          typeof item === "number" ? item : item.value
        );

        let max = Math.max(...dataArr);
        if (max > maxValue) maxValue = max;

        let min = Math.min(...dataArr);
        if (min < minValue) minValue = min;

        if (dataArr.length > maxAmount) maxAmount = dataArr.length;
      });
      if (this.max !== undefined && this.max > maxValue) maxValue = this.max;
      if (this.min !== undefined && this.min < minValue) minValue = this.min;
      return { maxValue, minValue, maxAmount };
    }
  },
  methods: {
    setSize() {
      const params = this.$refs["chart"].getBoundingClientRect();
      this.width = params.width;
      this.height = params.height;
    },
    fitLabels() {
      const chart = this.$refs["chart"];
      const chartLabels = this.$refs["chart-labels"];
      if (
        chartLabels &&
        ((chartLabels.xLabels && chartLabels.xLabels.length) ||
          chartLabels.yLabelsAmount > 0)
      ) {
        const chartParams = chart.getBoundingClientRect();
        const chartLabelsParams = chartLabels.$el.getBoundingClientRect();

        const top =
          chartParams.top - chartLabelsParams.top + this.paddingObject.top;
        const right =
          chartLabelsParams.right -
          chartParams.right +
          this.paddingObject.right;
        const bottom =
          chartLabelsParams.bottom -
          chartParams.bottom +
          this.paddingObject.bottom;
        const left =
          this.paddingObject.left - chartLabelsParams.left + chartParams.left;

        this.labelsOverflowObject = {
          top: top > 0 ? top : 0,
          right: right > 0 ? right : 0,
          bottom: bottom > 0 ? bottom : 0,
          left: left > 0 ? left : 0
        };
      } else {
        this.labelsOverflowObject = { top: 0, right: 0, bottom: 0, left: 0 };
      }
    },
    init() {
      this.setSize();
      this.$nextTick(() => {
        this.fitLabels();
      });
    },
    onWindowResize() {
      this.setSize();
    }
  },
  mounted() {
    this.init();
    window.addEventListener("resize", this.onWindowResize);
  },
  destroyed() {
    window.removeEventListener("resize", this.onWindowResize);
  },
  render(h) {
    const children = [];

    // Grid
    if (this.grid) {
      children.push(
        h(TrendChartGrid, {
          class: "vtc-grid",
          attrs: { ...this.grid }
        })
      );
    }

    // Labels
    if (this.labels) {
      children.push(
        h(TrendChartLabels, {
          class: "vtc-labels",
          ref: "chart-labels",
          attrs: { ...this.labels }
        })
      );
    }

    // Curves
    this.datasets.map(dataset => {
      children.push(
        h(TrendChartCurve, {
          class: "vtc-curve",
          attrs: { ...dataset }
        })
      );
    });

    // Render component
    return h(
      "svg",
      {
        class: "vtc",
        ref: "chart",
        attrs: {
          xmlns: "http://www.w3.org/2000/svg",
          width: "100%",
          height: "100%"
        }
      },
      children
    );
  }
};