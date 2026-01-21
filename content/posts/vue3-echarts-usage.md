---
title: 'Vue3 中使用 ECharts'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Vue']
date: '2022-04-14'
slug: 'vue3-echarts-usage'
summary: ''
last_edited_time: '2025-08-06T06:16:00.000Z'
blog_last_fetched_time: '2025-09-02T09:27:35.165Z'
page_id: 'ba1a6a3b-cfc3-4be8-9f7d-bf6c0334ab80'
icon: '📊'
---

## 使用 shallowRef 接收 Echarts 对象

```javascript
const chart = shallowRef(null);
chart.value = Echarts.init(document.getElementById(domId), theme, initOption);
```

## 需要在组件销毁时同步销毁图表对象

```javascript
onUnmounted(() => {
  chart.value.dispose();
});
```

## useChart.js

```javascript
import { onUnmounted, shallowRef } from 'vue';
import Echarts from '@/utils/echarts';
import * as _throttle from 'lodash/throttle';

export default function ({ domId, theme = 'antv', initOption, chartSchema, resizeWaitTime = 100 }) {
  let throttledChartResize = null;
  const chart = shallowRef(null);
  let isChartFirstLoaded = false;

  const initChart = () => {
    if (!isChartFirstLoaded) {
      chart.value = Echarts.init(document.getElementById(domId), theme, initOption);
      chartSchema && chart.value.setOption(chartSchema);
      throttledChartResize = _throttle(chart.value.resize, resizeWaitTime);
      window.addEventListener('resize', throttledChartResize);
    }
  };

  onUnmounted(() => {
    if (throttledChartResize) window.removeEventListener('resize', throttledChartResize);
    chart.value.dispose();
  });

  return { chart, initChart };
}
```

使用：

```javascript
const { chart, initChart } = useChart({
  domId: 'chart_container',
  chartSchema: {
    legend: {},
    tooltip: {
      trigger: 'item',
    },
    series: [
      {
        name: '来源',
        type: 'pie',
        radius: ['20%', '60%'],
        roseType: 'area',
      },
    ],
  },
});

onMounted(() => {
  initChart();
});
```
