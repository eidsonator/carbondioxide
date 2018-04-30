import { Line, mixins } from 'vue-chartjs'
const { reactiveProp } = mixins

export default {
  extends: Line,
  props: ['data', 'options'],
  mounted () {
    let options = [];
    options['fill'] = false; options['pointRadius'] = 0;
    options = options.concat(this.options);
    this.renderChart(this.data, options)
  },
  methods: {
    update() {
      this.$data._chart.update();
    }
  }
}
