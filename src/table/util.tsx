/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-param-reassign */
// 转换处理
import cloneDeep from 'lodash/cloneDeep';
import { Tooltip, Typography, Space } from 'antd';
import AdjustWidth from './adjust-width';
import { getType, isEmpty } from '@/util';
import { Fragment } from 'react';
import { TableColumnType } from './type.column';

export const transformColumns = (
  columns: TableColumnType[],
  emptyNode: any,
  onCellWidthChange: Function,
  pagination,
) => {
  const newColumns = cloneDeep(columns)?.filter((i) => i.visible !== false); // 避免污染、过滤下
  if (Array.isArray(columns)) {
    return newColumns.map((column) => {
      // 设置分页序号
      if (column.columnType === 'columnNo') {
        column.dataIndex = '__columnNo__'; // 唯一标识
        column.fixed = column.fixed || 'left'; // 默认左侧固定
        column.width = column.width || 100; // 默认100px
        column.render = (_, __, index) => {
          return (pagination.pageNum - 1) * pagination.pageSize + index + 1;
        };
        return column; // 直接返回不做扩展
      }
      // 提示信息
      if (column.tip) {
        // eslint-disable-next-line no-param-reassign
        column.title = (
          <Space>
            {column.title}
            <Tooltip placement="top" title={column.tip}>
              <i
                className="iconfont spicon-yiwen"
                style={{ color: '#999', fontSize: 15 }}
              />
            </Tooltip>
          </Space>
        );
      }
      // 实现拖拽功能
      if (column.resize) {
        // eslint-disable-next-line no-param-reassign
        column.title = (
          <AdjustWidth
            width={column.width}
            onCellWidthChange={(width) => {
              onCellWidthChange(column, width);
            }}
          >
            {column.title}
          </AdjustWidth>
        );
      }
      // ellipsis 扩展, 移除标题
      if (column.ellipsis) {
        column.ellipsis = {
          showTitle: false,
        };
      }
      const defineRender: any = column.render; // 获取用户定义的render
      // 扩展render
      column.render = (item, record, index) => {
        let vNode: any =
          typeof defineRender === 'function'
            ? defineRender(item, record, index)
            : item; // 定义了则先执行render
        // 枚举
        if (column.enums) {
          // 数组对象情况需要针对性key
          const {
            isArrObj = false,
            key = 'value',
            label = 'label',
          } = column.enumsConf || {};
          const type = getType(column.enums);
          if (isArrObj && type === 'array') {
            const it = column.enums.find((i) => i[key] === item);
            vNode = it?.[label];
          } else if (['array', 'object'].includes(type)) {
            vNode = column.enums[item];
          }
        }
        // 处理空数据展示
        if (emptyNode) {
          vNode = isEmpty(vNode) ? emptyNode : vNode;
        }
        // 添加link标识
        if (column.link) {
          vNode = <a>{vNode}</a>;
        }
        // 千分位处理
        if (column.useThousandth) {
          vNode = NumberFormat(
            vNode,
            typeof column.useThousandth === 'boolean'
              ? undefined
              : column.useThousandth,
            emptyNode,
          );
        }
        // ellipsis 扩展
        if (column.ellipsis) {
          vNode = (
            <Tooltip placement="topLeft" title={vNode}>
              {vNode}
            </Tooltip>
          );
        }
        // 支持复制
        if (column.copyable) {
          vNode = (
            <Space>
              {vNode}
              <Typography.Paragraph
                copyable={
                  typeof column.copyable === 'object'
                    ? column.copyable
                    : {
                        text: item,
                      }
                }
                style={{ marginBottom: 0 }}
                onClick={(e) => {
                  // 阻止冒泡
                  e.stopPropagation();
                }}
              />
            </Space>
          );
        }
        if (column.suffix) {
          vNode = (
            <Fragment>
              {vNode}
              {column.suffix}
            </Fragment>
          );
        }
        return vNode;
      };
      return column;
    });
  }
  return [];
};

// 千分位，小数点2位
export const NumberFormat = (
  number: any,
  options = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  },
  emptyNode = '-',
) => {
  if (isNaN(Number.parseFloat(number))) {
    return emptyNode;
  }
  return Number(number).toLocaleString('zh-CH', options);
};
