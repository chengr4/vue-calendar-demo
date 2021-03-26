<template>
  <v-row class="fill-height">
    <v-col>
      <v-sheet height="60">
        <v-toolbar flat>
           <v-toolbar-title>
            預約行事曆
          </v-toolbar-title>
          <v-btn outlined class="mx-4" @click="setToday"> Today </v-btn>
          <v-btn fab text small @click="prev">
            <v-icon small> mdi-chevron-left </v-icon>
          </v-btn>
          <v-btn fab text small @click="next">
            <v-icon small> mdi-chevron-right </v-icon>
          </v-btn>
          <v-toolbar-title v-if="$refs.calendar">
            {{ $refs.calendar.title }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-menu bottom right>
            <template v-slot:activator="{ on, attrs }">
              <v-btn outlined rounded v-bind="attrs" v-on="on" color="#7f74b4">
                <span>{{ typeToLabel[type] }}</span>
                <v-icon right> mdi-menu-down </v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="type = 'day'">
                <v-list-item-title>日檢視</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'week'">
                <v-list-item-title>週檢視</v-list-item-title>
              </v-list-item>
               <v-list-item @click="type = 'month'">
                <v-list-item-title>月檢視</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-menu bottom right>
            <template v-slot:activator="{ on, attrs }">
              <v-btn outlined rounded v-bind="attrs" v-on="on" color="#7f74b4">
                <span>{{ people[personIndex] }}</span>
                <v-icon right> mdi-menu-down </v-icon>
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
                v-model="start"
                type="time"
                label="開始時間"
              ></v-text-field>
              <v-text-field
                v-model="end"
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

      <v-sheet height="85%">
        <v-calendar
          ref="calendar"
          v-model="focus"
          color="#7f74b4"
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
          <v-card color="grey lighten-4" min-width="350px" flat>
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
      </v-sheet>
      <v-container>
        <v-btn outlined rounded block class="ma-auto" @click="dialog = true">
          + 新增預約
        </v-btn>
      </v-container>
    </v-col>
  </v-row>
</template>

<script>
import { db } from "@/main";

export default {
  data: () => ({
    focus: "",
    type: "month",
    typeToLabel: {
      month: "月檢視",
      week: "週檢視",
      day: "日檢視",
    },
    selectedEvent: {},
    selectedElement: null,
    selectedOpen: false,
    currentlyEditing: null,
    events: [],
    people: ["James", "Karl", "Lily"],
    personIndex: 0,
    dialog: false,
    start: null,
    end: null,
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
      event.color = "grey"
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
  },
};
</script>

<style scoped>
.ma-auto {
  background-color: #7f74b4;
}
</style>