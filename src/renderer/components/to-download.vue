<template>

  <el-collapse-item
    class="p-to-download"
    @change="handleChange"
  >
    <template slot="title">
      <div class="download-header">
        <strong>
          {{this.name}}
        </strong>

        <div class="info">
          <span>
            <p-icon
              name="signal"
              width="12"
              height="12"
            /> {{this.$props.todo.connections}}
            <p-icon
              name="magnet"
              width="12"
              height="12"
            /> {{this.$props.todo.numSeeders}}
            <p-icon
              name="file-alt"
              width="12"
              height="12"
            /> {{this.$props.todo.files.filter(it=>Number(it.completedLength)>=Number(it.length)).length}}/{{this.$props.todo.files.length}}
            <i
              class="el-icon-loading"
              v-if="this.$props.todo.status==='active'"
            ></i>
          </span>
          <span>
            <p-icon
              name="download"
              width="12"
              height="12"
            /> {{this.common.getSize(this.$props.todo.downloadSpeed)+"/s"}}
            &emsp;剩余时间: {{this.getCastTime()}}
          </span>
          <span>
            {{this.common.getSize(this.$props.todo.completedLength)}}
            /
            {{this.common.getSize(this.$props.todo.totalLength)}}
          </span>
        </div>

      </div>
      <el-progress
              id="progress"
        class="progress"
        type="circle"
        style="font-size:15px;"
              :stroke-width="9"
        :percentage="this.getPercent(this.$props.todo.completedLength,this.$props.todo.totalLength)"
        :width="55"
      ></el-progress>
      <el-dropdown @command="chooseCommand">
        <span class="el-dropdown-link">
          &emsp;<i class="el-icon-arrow-down el-icon--right"></i>&nbsp; &emsp;
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            command="pause"
            v-if="['active'].indexOf(this.$props.todo.status)!==-1"
          >暂停</el-dropdown-item>
          <el-dropdown-item
            command="stop"
            v-if="['active','paused'].indexOf(this.$props.todo.status)!==-1"
          >终止</el-dropdown-item>
          <el-dropdown-item
            command="unpause"
            v-if="['paused'].indexOf(this.$props.todo.status)!==-1"
          >继续下载</el-dropdown-item>
          <el-dropdown-item
            command="restart"
            v-if="['complete','error','removed'].indexOf(this.$props.todo.status)!==-1"
          >重新下载</el-dropdown-item>
          <el-dropdown-item
            command="remove"
            v-if="['complete','error','removed'].indexOf(this.$props.todo.status)!==-1"
          >删除</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </template>
    <el-tabs
      type="border-card"
      @tab-click="this.tabChange"
    >
      <el-tab-pane label="概况">
        <div style="padding: 0 14px;" v-for="it in this.getInfoTable()">
          <strong>{{it.name}}</strong>
          <div class="bottom clearfix" v-html="it.value"
               style="padding-left: 2rem;width: calc(100% - 2rem);word-wrap: break-word;">

          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane
        label="区块信息"
        v-if="this.type!=='FTP'&&this.pieces.length>0"
      >
        <div class="piece-info">
          <span :title="this.pieces.filter(it=>it===1).length+'块'"><span
              class="piece filled"
              style="vertical-align:middle"
            ></span> 已完成</span>
          <span :title="this.pieces.filter(it=>it===0).length+'块'"><span
              class="piece"
              style="vertical-align:middle"
            ></span> 未完成</span>
        </div>
        <div>
          <span
            class="piece"
            v-for="(it,index) in this.pieces"
            :key="index"
            :class="it===0?'':'filled'"
          ></span>
        </div>
      </el-tab-pane>
      <el-tab-pane
        label="文件列表"
        v-if="!!this.$props.todo.bittorrent"
      >
        <div style="display: flex;align-content: space-between;">
          <div style="flex:1">
            <el-tag>文件总数（{{this.$props.todo.files.length}}）</el-tag>
          </div>
          <el-button
            type="primary"
            size="mini"
            round
            @click="this.rechooseFile"
            v-if="['active','paused'].indexOf(this.$props.todo.status)!==-1"
          >上传<i class="el-icon-upload el-icon--right"></i></el-button>
        </div>
        <el-tree
          :data="this.getFileTree()"
          show-checkbox
          default-expand-all
          node-key="id"
          ref="tree"
          highlight-current
          :props="defaultProps"
          :default-checked-keys="this.checks"
          @check-change="this.checkChange"
        >
        </el-tree>
      </el-tab-pane>
      <el-tab-pane
        label="链接详情"
        v-if="this.$props.todo.status==='active'"
      >
        <table style="width:100%;text-align: center;">
          <thead>
          <tr>
            <th>位置</th>
            <th>客户端</th>
            <th>完成率</th>
            <th>下载速度</th>
            <th>上传速度</th>
            <th>状态</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="it in this.getPeersTable()">
            <td>{{it.name}}</td>
            <td>{{it.type}}</td>
            <td>{{it.percent}}</td>
            <td>{{it.downloadSpeedStr}}</td>
            <td>{{it.uploadSpeedStr}}</td>
            <td>{{it.state}}</td>
          </tr>
          </tbody>
        </table>
      </el-tab-pane>
    </el-tabs>
  </el-collapse-item>

</template>
<script>
import 'vue-awesome/icons/link'
import 'vue-awesome/icons/signal'
import 'vue-awesome/icons/magnet'
import 'vue-awesome/icons/file-alt'
import 'vue-awesome/icons/download'


import store from "@/store/modules/base/store.js"
import common from "@/assets/util/common.js"
import PanUtil from "@/assets/util/PanUtil.js"
import { setInterval, clearInterval, setTimeout } from 'timers';
export default {
  store,
  props: {
    todo: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      common,
      isCollapse: true,
      type: null,
      pieces: this.getPieces(),
      dir: this.$props.todo.dir,
      connectInterval: null,
      name: null,
      files:  this.$props.todo.files,
      checks: [],
      defaultProps: {
        children: 'children',
        label(data, node) {
          // console.log(node)
          return (
            !node.isLeaf ?
              "♜ "
              : "✉ "
              + common.getSize(data.data.data.length) + " - "
              + (data.data.data.length === "0" ?
                "0" :
                (
                  Math.round(
                    Number(data.data.data.completedLength) * 10000
                    / Number(data.data.data.length)
                  ) / 100
                  + "% | "
                )
              )
          )

            + data.name;
        }
      }
    };
  },
  mounted() {
    // console.log(PanUtil.toTree(this.getFiles2(), "id", "pid", "name"))
    if (this.$props.todo.bittorrent) {
      if (this.$props.todo.bittorrent.info) {
        this.type = "Torrent"
        this.name = "✪ " + this.$props.todo.bittorrent.info.name;
        this.checks = this.$props.todo.files.filter(it => it.selected === 'true').map(it => it.index).concat();
      } else {
        this.type = "Magnet";
        this.name = "◑ " + this.$props.todo.files[0].path;
      }
    } else if (new RegExp("^ftp://").test(this.$props.todo.files[0].uris[0].uri)) {
      this.type = "FTP";
      this.name = "☢ " + decodeURIComponent(this.$props.todo.files[0].uris[0].uri.substring(this.$props.todo.files[0].uris[0].uri.lastIndexOf("/") + 1));
    } else if (new RegExp("^https?://").test(this.$props.todo.files[0].uris[0].uri)) {
      this.type = "HTTP/HTTPS";
      this.name = "☪ " + decodeURIComponent(this.$props.todo.files[0].uris[0].uri.substring(this.$props.todo.files[0].uris[0].uri.lastIndexOf("/") + 1));
    }
  },
  methods: {
    tabChange(v, e) {
      if (v.paneName === "3") {
        this.connectInterval = setInterval(() => {
          this.$store.dispatch("sendToWebSocket", { jsonrpc: "2.0", method: "aria2.getPeers", id: common.getReqId(common.reqType.sendGetPeersREQ), params: [this.$props.todo.gid] })
        }, 1000)
      } else {
        if (this.connectInterval) {
          clearInterval(this.connectInterval);
        }
      }
    },
    handleChange(val) {
      console.log(val);
    },
    getPercent(fz, fm) {
      if (Number(fm) === 0) { return 0; }
      return Math.round(Number(fz) * 10000 / Number(fm)) / 100;
    },
    getCastTime() {
      let time = "∞";
      if (this.$props.todo.downloadSpeed !== "0") {
        let leave = Number(this.$props.todo.totalLength) - Number(this.$props.todo.completedLength);
        let long = Math.round(leave / Number(this.$props.todo.downloadSpeed));
        time = Math.floor(long / 60 / 60) + ":" + Math.floor(long % (60 * 60) / 60) + ":" + Math.floor(long % 60);
      }
      return time;
    },
    parseState(state, it) {

      switch (state) {
        case "active": return "正在下载";
        case "complete": return "已完成";
        case "error": return "异常终止 - " + common.Aria2ErrorCode[it.errorCode] + "";
        case "paused": return "暂停";
        case "waiting": return "正在连接";
        case "removed": return "已删除";
        default:
          return "未知"
      }
    },
    getInfoTable() {
      let re = [
        { name: "任务类型", value: this.type },
        { name: "任务状态", value: "<span title='" + this.$props.todo.errorMessage + "'>" + this.parseState(this.$props.todo.status, this.$props.todo) + "</span>" },
        { name: "连接数", value: this.$props.todo.connections },
        { name: "下载路径", value: this.$props.todo.dir },

      ];
      if (this.$props.todo.bittorrent) {
        let magnet = "magnet:?xt=urn:btih:" + this.$props.todo.infoHash;
        re.push({ name: "磁力链接", value: "<a href='" + magnet + "' target='_blank' style='text-decoration: none;'>" + magnet + "</a>" });
        re.push({ name: "下载路径", value: "<textarea style='width:100%;resize:none;' rows=5>" + this.$props.todo.bittorrent.announceList.map(it => it[0]).join("\n") + "</textarea>" });
      } else {
        re.push({ name: "链接地址", value: "<a href='" + this.$props.todo.files[0].uris[0].uri + "' target='_blank' style='text-decoration: none;'>" + this.$props.todo.files[0].uris[0].uri + "</a>" });
      }
      console.log(re)
      return re;
    },
    getFiles2() {
      let diridx = 0;
      let map = {};
      let arr = [];
      const step = "&emsp;&emsp;&emsp;&emsp;";
//      if (this.files === null || this.files.length === 0) {
//        this.files = this.$props.todo.files;
//      }
      this.files.forEach(it => {
        var path = it.path.replace(this.dir.replace("\\", "/"), "");
        if (path[0] === "/") {
          path = path.substring(1);
        }
        let dirs = path.split("/");
        if (dirs.length === 1) {
          arr.push({ id: it.index, key: "0|" + dirs[0], name: dirs[0], pid: 0, data: it });
        } else {
          for (let i = 1; i < dirs.length; i++) {
            if (!map[(i - 1) + "|" + dirs[i - 1]]) {
              let id = "dir_" + diridx++;
              map[(i - 1) + "|" + dirs[i - 1]] = id;
              arr.push({ id: id, key: (i - 1) + "|" + dirs[i - 1], name: dirs[i - 1], pid: 0, data: it });
            }
            if (i == dirs.length - 1) {
              arr.push({ id: it.index, key: i + "|" + dirs[i], name: dirs[i], pid: map[(i - 1) + "|" + dirs[i - 1]], data: it });
            } else {
              if (!map[i + "|" + dirs[i]]) {
                let id = "dir_" + diridx++;
                map[i + "|" + dirs[i]] = id;
                arr.push({ id: id, key: i + "|" + dirs[i], name: dirs[i], pid: map[(i - 1) + "|" + dirs[i - 1]], data: it });
              }
            }
          }
        }
      })
      return arr;
    },
    getFileTree() {
      return [PanUtil.toTree(this.getFiles2(), 'id', 'pid', 'name')]
    },
    checkChange(it, choose, pchoose) {
      this.checks = this.$refs.tree.getCheckedKeys();
    },
    getPieces() {
      if (this.isCollapse) {
        return [];
      }
      let arr1 = [];
      let complete = 0;
      let alls = this.$props.todo.numPieces;
      if (this.$props.todo.bitfield) {
        arr1 = common.parseHexStringToBitArray(this.$props.todo.bitfield);
        complete = arr1.filter(it => it === 1).length;
      }
      let arr2 = [];
      let start = 0;
      alls = 0;
      this.$props.todo.files.forEach(it => {
        let size = Math.ceil(it.length / this.$props.todo.pieceLength);
        if (it.selected === "true") {
          arr2 = arr2.concat(arr1.slice(start, size));
          alls += it.length;
        }
        start += Math.ceil(it.length / this.$props.todo.pieceLength);
      });

      arr1 = arr2;
      alls = Math.floor(alls / Number(this.$props.todo.pieceLength));
      return arr1;
    },
    parsePeerInfo(peerid) {
      try {
        var ret = window.format_peerid(peerid);
        if (ret.client == 'unknown') throw 'unknown';
        return ret.client + (ret.version ? '-' + ret.version : '');
      } catch (e) {
        if (peerid == '%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00')
          return 'unknown';
        var ret = unescape(peerid).split('-');
        for (var i = 0; i < ret.length; i++) {
          if (ret[i].trim().length) return ret[i];
        }
        return 'unknown';
      }
    },
    getPeersTable() {
      return this.$store.state.peers.map(it => {
        it.name = it.ip + ":" + it.port
        it.type = this.parsePeerInfo(it.peerId);
        it.downloadSpeedStr = common.getSize(it.downloadSpeed) + "/s";
        it.uploadSpeedStr = common.getSize(it.uploadSpeed) + "/s";
        let arr = common.parseHexStringToBitArray(it.bitfield);
        it.percent = Math.round(arr.filter(it => it === 1).length / arr.length * 10000) / 100 + "%";
        it.state = it.peerChoking === "false" ? "通畅" : "堵塞";
        return it;
      });
    },
    chooseCommand(command) {
      switch (command) {
        case 'pause': {
          this.$store.dispatch("sendToWebSocket", { jsonrpc: "2.0", method: "aria2.pause", id: common.getReqId(common.reqType.sendPauseREQ), params: [this.$props.todo.gid] })
          break;
        }
        case 'unpause': {
          this.$store.dispatch("sendToWebSocket", { jsonrpc: "2.0", method: "aria2.unpause", id: common.getReqId(common.reqType.sendUnpauseREQ), params: [this.$props.todo.gid] })
          break;
        }
        case 'restart': {
          this.$store.dispatch("sendToWebSocket", { jsonrpc: "2.0", method: "aria2.removeDownloadResult", id: common.getReqId(common.reqType.sendRemoveDownloadResultREQ), params: [this.$props.todo.gid] })
          if (this.type === "Torrent" || this.type === "Magnet") {
            this.$store.dispatch("sendToWebSocket", {
              jsonrpc: "2.0",
              method: "aria2.addUri",
              id: common.getReqId(common.reqType.sendRestartREQ),
              params: [
                ["magnet:?xt=urn:btih:" + this.$props.todo.infoHash],
                this.$props.todo
              ]
            })
          } else if (this.type === "FTP") {
            this.$store.dispatch("sendToWebSocket", {
              jsonrpc: "2.0",
              method: "aria2.addUri",
              id: common.getReqId(common.reqType.sendRestartREQ),
              params: [
                [this.$props.todo.files[0].uris[0].uri],
                this.$props.todo
              ]
            })
          }
          break;
        }
        case 'stop': {
          //仅针对正在下载的任务
          this.$store.dispatch("sendToWebSocket", { jsonrpc: "2.0", method: "aria2.remove", id: common.getReqId(common.reqType.sendRemoveREQ), params: [this.$props.todo.gid] })
          // this.$store.dispatch("sendToWebSocket", { jsonrpc: "2.0", method: "aria2.forceRemove", id: common.getReqId(common.reqType.sendForceRemoveREQ), params: [this.$props.todo.gid] })
          break;
        }
        case 'remove': {
          this.$store.dispatch("sendToWebSocket", { jsonrpc: "2.0", method: "aria2.removeDownloadResult", id: common.getReqId(common.reqType.sendRemoveDownloadResultREQ), params: [this.$props.todo.gid] })
          break;
        }
      }
    },
    rechooseFile() {
      console.log(this.$refs.tree.getCheckedKeys());
      this.$store.dispatch("sendToWebSocket", {
        jsonrpc: "2.0",
        method: "aria2.changeOption",
        id: common.getReqId(common.reqType.sendChangeOptionResultREQ),
        params: [
          this.$props.todo.gid,
          { "select-file": this.$refs.tree.getCheckedKeys().join(",") }
        ]
      })
      setTimeout(() => {
        if (this.checks.sort().toString() !== this.$props.todo.files.filter(it => it.selected === 'true').map(it => it.index).sort().toString()) {
          console.info("任务下载文件确认已变更")
          this.checks = this.$props.todo.files.filter(it => it.selected === 'true').map(it => it.index);
        }
      }, 3000);
    }
  }
}
</script>
<style>
  #progress{font-size: 24px!important;}
.p-to-download .el-tab-pane {
  height: 280px;
  overflow: auto;
}
.p-to-download .el-badge__content {
  color: #212529;
  background-color: #f8f9fa;
}
.p-to-download .el-collapse-item__arrow.el-icon-arrow-right {
  display: none;
}
.p-to-download .piece-info {
  text-align: center;
  vertical-align: middle;
  border-bottom: 1px dashed silver;
  margin-bottom: 16px;
  padding-bottom: 8px;
}
.p-to-download .piece {
  width: 10px;
  height: 10px;
  display: inline-block;
  background-color: #eef2f4;
  border: 1px solid #dee2e5;
  margin: 0 2px 4px 0;
}
.p-to-download .piece.filled {
  background-color: #b8dd69;
  border-color: #b8dd69;
}
.p-to-download .el-table td {
  padding: 6px 0;
}
.p-to-download .el-table .cell {
  line-height: 22px;
}
.p-to-download .progress {
  margin-right: 12px;
}
.p-to-download .el-collapse-item__content {
  padding-bottom: 2px;
}
.p-to-download .el-collapse-item__header {
  height: 60px;
  line-height: 30px;
}
.p-to-download .download-header {
  padding-left: 24px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 12px;
}
.p-to-download .download-header .info {
  display: flex;
  justify-content: space-between;
  padding-right: 18px;
  font-size: 11pt;
}
</style>
