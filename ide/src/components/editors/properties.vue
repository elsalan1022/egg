<template>
  <div class="props" :maximized="maximized" style="display: flex; flex-direction: column">
    <div class="props-header" style="align-items: center; display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: flex-end">
      <i class="icon-translate" style="margin: 0 8px" @click="maximized = !maximized"></i>
      <label v-if="maximized" class="props-title" style="flex: 1 1 auto">{{ title }}</label>
      <i :class="maximized ? 'icon-minimize' : 'icon-maximize'" @click="maximized = !maximized" style="margin-right: 8px"></i>
    </div>
    <div class="props-body" v-if="maximized">
      <block v-if="Object.keys(groups).length <= 1">
        <Property class="props-item" v-for="item in properties" :key="item.name" :item="item" :scoped="scoped"></Property>
      </block>
      <el-collapse v-else v-model="activeNames">
        <el-collapse-item v-for="(items, name) in groups" :key="name" :name="name" :title="$t(`nm.${name}`, name)">
          <Property class="props-item" v-for="item in items" :key="item.name" :item="item" :scoped="scoped"></Property>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>
<script lang='ts'>
import Property from './property.vue';
export default {
  components: {
    Property,
  },
  props: {
    scoped: {
      type: String,
      default: 'unit',
    },
  },
  data() {
    return {
      maximized: false,
      activeNames: ['default'],
    };
  },
  computed: {
    selected() {
      return this.$store.state.selected.unit;
    },
    title() {
      if (!this.$store.state.selected.unit) {
        return this.$t('properties');
      }
      const { name } = this.$store.state.selected.unit;
      return this.$t(`nm.${this.$store.state.selected.unit.name}`, name);
    },
    properties() {
      if (!this.$store.state.selected.unit) {
        return [];
      }
      return Object.values(this.$store.state.selected.unit.properties);
    },
    groups() {
      if (!this.$store.state.selected.unit) {
        return {};
      }
      const groups: any = {};
      Object.values(this.$store.state.selected.unit.properties).forEach((prop: any) => {
        const gname = prop.group || 'default';
        const items = groups[gname] || (groups[gname] = []);
        items.push(prop);
      });
      return groups;
    },
  },
  watch: {
    selected() {
      this.activeNames = Object.keys(this.groups);
    },
  },
  methods: {},
};
</script>
<style scoped>
.props {
  width: 320px;
  padding: 6px;
  overflow: hidden;
}
.props[maximized='false'] {
  align-self: flex-end;
  width: unset;
}
.props i {
  cursor: pointer;
}
.props-header {
  min-height: 26px;
  background: hsla(215, 100%, 95%, 1);
  margin: -6px;
  padding: 4px 0px;
}
.props-title {
  text-align: left;
  align-content: center;
  margin-left: 8px;
}
.props-body {
  padding-top: 10px;
}
.props-item {
  margin: 6px 0;
}
</style>
