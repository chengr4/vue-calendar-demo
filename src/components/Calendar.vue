<template>
  <v-row class="fill-height">
    <v-col>
      <v-sheet>
        <v-toolbar flat id="toolbar">
          <v-toolbar-title class="title"> 預約行事曆 </v-toolbar-title>
          <v-btn outlined class="today mx-5" @click="setToday"> Today </v-btn>
          <v-btn fab text small @click="prev">
            <v-icon small> mdi-chevron-left </v-icon>
          </v-btn>
          <v-toolbar-title v-if="$refs.calendar">
            {{ $refs.calendar.title }}
          </v-toolbar-title>
          <v-btn fab text small @click="next">
            <v-icon small> mdi-chevron-right </v-icon>
          </v-btn>
          <v-spacer></v-spacer>
          <v-menu bottom right>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                rounded
                outlined
                v-bind="attrs"
                v-on="on"
                class="pick-date"
              >
                <span>{{ typeToLabel[type] }}</span>
                <v-icon right> mdi-menu-down </v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="type = 'day'">
                <v-list-item-title>日</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'week'">
                <v-list-item-title>週</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'month'">
                <v-list-item-title>月</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-menu bottom right>
            <template v-slot:activator="{ on, attrs }">
              <v-btn rounded outlined v-bind="attrs" v-on="on" class="member">
                <span>{{ people[personIndex] }}</span>
              </v-btn>
            </template>
          </v-menu>
        </v-toolbar>
      </v-sheet>

      <!-- Dialog of adding event -->
      <v-dialog v-model="dialog" max-width="500">
        <v-card>
          <v-container>
            <v-form @submit.prevent="addEvent">
              <v-text-field
                v-model="name"
                type="text"
                label="加入預約 (必填)"
              ></v-text-field>
              <v-text-field
                v-model="details"
                type="text"
                label="備註"
              ></v-text-field>
              <v-text-field
                v-model="start"
                type="date"
                label="開始日期 (必填)"
              ></v-text-field>
              <v-text-field
                v-model="end"
                type="date"
                label="結束日期 (必填)"
              ></v-text-field>
              <v-text-field
                v-model="startTime"
                type="time"
                label="開始時間"
              ></v-text-field>
              <v-text-field
                v-model="endTime"
                type="time"
                label="結束時間"
              ></v-text-field>
              <v-btn
                type="submit"
                color="#7f74b4"
                class="mr-4"
                @click.stop="dialog = false"
              >
                新增預約
              </v-btn>
            </v-form>
          </v-container>
        </v-card>
      </v-dialog>

      <v-sheet height="80%">
        <v-calendar
          ref="calendar"
          v-model="focus"
          color="#7f74b4"
          interval-width="40"
          event-text-color="black"
          :weekday-format="getDate"
          :events="events"
          :event-color="getEventColor"
          :type="type"
          @click:event="showEvent"
          @click:more="viewDay"
          @click:date="viewDay"
        ></v-calendar>

        <!-- pop-up -->
        <v-menu
          v-model="selectedOpen"
          :close-on-content-click="false"
          :activator="selectedElement"
          offset-x
        >
          <v-card color="grey lighten-4" flat>
            <v-toolbar :color="selectedEvent.color" dark>
              <v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn @click="deleteEvent(selectedEvent.id)" icon>
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-toolbar>
            <v-card-text>
              <form v-if="currentlyEditing !== selectedEvent.id">
                {{ selectedEvent.details }}
              </form>
              <form v-else>
                <textarea-autosize
                  v-model="selectedEvent.details"
                  type="text"
                  style="width: 100%"
                  :min-height="100"
                  placeholder="add note"
                >
                </textarea-autosize>
              </form>
            </v-card-text>
            <v-card-actions>
              <v-btn
                text
                color="secondary"
                @click="selectedOpen = false"
                class="ml-auto"
              >
                取消
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
        <v-container class="book">
          <v-btn outlined rounded @click="dialog = true" class="btn-book">
            + 新增預約
          </v-btn>
        </v-container>
      </v-sheet>
    </v-col>
  </v-row>
</template>

<script>
import { db } from "@/main";

export default {
  name: "Calendar",
  data: () => ({
    focus: "",
    type: "month",
    typeToLabel: {
      month: "月",
      week: "週",
      day: "日",
    },
    selectedEvent: {},
    selectedElement: null,
    selectedOpen: false,
    currentlyEditing: null,
    events: [],
    people: ["莉"],
    personIndex: 0,
    dialog: false,
    start: null,
    end: null,
    startTime: "00:00",
    endTime: "00:00",
    details: null,
    name: null,
  }),
  mounted() {
    this.$refs.calendar.checkChange();
    this.getEvents();
  },
  methods: {
    viewDay({ date }) {
      this.focus = date;
      this.type = "day";
    },
    getEventColor(event) {
      event.color = "grey";
      return event.color;
    },
    setToday() {
      this.focus = "";
    },
    prev() {
      this.$refs.calendar.prev();
    },
    next() {
      this.$refs.calendar.next();
    },
    async getEvents() {
      let snapshot = await db.collection("myEvent").get();
      let events = [];
      snapshot.forEach((doc) => {
        let data = doc.data();
        data.id = doc.id;
        events.push(data);
      });
      this.events = events;
    },
    showEvent({ nativeEvent, event }) {
      const open = () => {
        this.selectedEvent = event;
        // <div>...
        this.selectedElement = nativeEvent.target;
        setTimeout(() => {
          this.selectedOpen = true;
        }, 10);
      };
      if (this.selectedOpen) {
        this.selectedOpen = false;
        setTimeout(open, 10);
      } else {
        open();
      }
      nativeEvent.stopPropagation();
    },
    async addEvent() {
      if (this.name && this.start && this.end) {
        if (!this.checkDate()) return;

        // 更新資料庫
        await db.collection("myEvent").add({
          name: this.name,
          details: this.details,
          start: this.start,
          end: this.end,
        });
        this.getEvents();
        (this.name = ""),
          (this.details = ""),
          (this.start = ""),
          (this.end = ""),
          (this.color = "");
      } else {
        alert("項目和日期為必填");
      }
    },
    async deleteEvent(ev) {
      await db.collection("myEvent").doc(ev).delete();
      (this.selectedOpen = false), this.getEvents();
    },
    checkDate() {
      const begin = new Date(`${this.start}` + `T${this.startTime}:00`);
      const over = new Date(`${this.end}` + `T${this.endTime}:00`);

      // 結束時間必須在開始時間之後
      if (begin.getTime() <= over.getTime()) {
        this.start = begin.toISOString().substr(0, 19);
        this.end = over.toISOString().substr(0, 19);
        return true;
      } else {
        alert("結束時間不可以早於開始時間");
        return false;
      }
    },
    // 更換星期顯示方式
    getDate(date) {
      const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
      let i = date.weekday;
      return daysOfWeek[i];
    },
  },
};
</script>

<style scoped>
/* 右上角的兩個按鈕 */
.pick-date,
.member {
  background-color: #dedaf4;
  height: 36px;
  min-width: 64px;
  margin: 0px 10px;
}

.btn-book {
  background-color: #7f74b4;
  bottom: 5%;
  position: fixed;
  max-width: 200px;
}

.row {
  max-width: 1200px;
  max-height: 800px;
  margin: auto;
}

.col {
  display: flex-wrap;
}

/* Mobile (手機用) */
@media (max-width: 500px) {
  /* 右上角的兩個按鈕 */
  .pick-date,
  .member {
    height: 36px;
    min-width: 64px;
    margin: 0px 2px;
    background-color: #dedaf4;
  }

  .v-application .title,
  .v-application .mx-5 {
    display: none;
  }
  .col {
    max-height: 660px;
  }

  /* toolbar 整體 */
  .v-toolbar__content {
    padding: 4px 0px;
  }
}
</style>