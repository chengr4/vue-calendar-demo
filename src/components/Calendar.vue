<template>
  <v-row class="fill-height">
    <v-col>
      <v-sheet height="64">
        <v-toolbar flat>
          <v-btn outlined class="mr-4" @click="setToday"> Today </v-btn>
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
              <v-btn outlined v-bind="attrs" v-on="on">
                <span>{{ typeToLabel[type] }}</span>
                <v-icon right> mdi-menu-down </v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="type = 'day'">
                <v-list-item-title>Day</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'week'">
                <v-list-item-title>Week</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'month'">
                <v-list-item-title>Month</v-list-item-title>
              </v-list-item>
            </v-list>
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
                label="event name (required)"
              ></v-text-field>
              <v-text-field
                v-model="details"
                type="text"
                label="detail"
              ></v-text-field>
              <v-text-field
                v-model="start"
                type="date"
                label="start (required)"
              ></v-text-field>
              <v-text-field
                v-model="end"
                type="date"
                label="end (required)"
              ></v-text-field>
              <v-btn
                type="submit"
                color="primary"
                class="mr-4"
                @click.stop="dialog = false"
              >
                新增預約
              </v-btn>
            </v-form>
          </v-container>
        </v-card>
      </v-dialog>

      <v-sheet height="600">
        <v-calendar
          ref="calendar"
          v-model="focus"
          color="primary"
          :events="events"
          :event-color="getEventColor"
          :type="type"
          @click:event="showEvent"
          @click:more="viewDay"
          @click:date="viewDay"
          @change="updateRange"
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
              <v-btn
                v-if="currentlyEditing !== selectedEvent.id"
                text
                @click.prevent="editEvent(selectedEvent)"
              >
                編輯
              </v-btn>
              <v-btn
                text
                v-else
                type="submit"
                @click.prevent="updateEvent(selectedEvent)"
              >
                儲存
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-sheet>
      <v-btn outlined class="ml-7" @click="dialog = true"> + 新增預約 </v-btn>
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
      month: "Month",
      week: "Week",
      day: "Day",
    },
    selectedEvent: {},
    selectedElement: null,
    selectedOpen: false,
    currentlyEditing: null,
    events: [],
    colors: [
      "blue",
      "indigo",
      "deep-purple",
      "cyan",
      "green",
      "orange",
      "grey darken-1",
    ],
    names: [
      "Meeting",
      "Holiday",
      "PTO",
      "Travel",
      "Event",
      "Birthday",
      "Conference",
      "Party",
    ],
    peoples: ["James", "Karl", "Lily"],
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
        console.log(event);
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
        alert("You must enter event name, start, and end time");
      }
    },
    editEvent(ev) {
      this.currentlyEditing = ev.id;
    },
    async updateEvent(ev) {
      await db.collection("myEvent").doc(this.currentlyEditing).update({
        details: ev.details,
      });
      (this.selectedOpen = false), (this.currentlyEditing = null);
    },
    async deleteEvent(ev) {
      await db.collection("myEvent").doc(ev).delete();
      (this.selectedOpen = false), this.getEvents();
    },
    updateRange({ start, end }) {
      const events = [];

      const min = new Date(`${start.date}T00:00:00`);
      const max = new Date(`${end.date}T23:59:59`);
      const days = (max.getTime() - min.getTime()) / 86400000;
      const eventCount = this.rnd(days, days + 20);

      for (let i = 0; i < eventCount; i++) {
        const allDay = this.rnd(0, 3) === 0;
        const firstTimestamp = this.rnd(min.getTime(), max.getTime());
        const first = new Date(firstTimestamp - (firstTimestamp % 900000));
        const secondTimestamp = this.rnd(2, allDay ? 288 : 8) * 900000;
        const second = new Date(first.getTime() + secondTimestamp);

        events.push({
          name: this.names[this.rnd(0, this.names.length - 1)],
          start: first,
          end: second,
          color: this.colors[this.rnd(0, this.colors.length - 1)],
          timed: !allDay,
        });
      }

      //this.events = events
    },
    rnd(a, b) {
      return Math.floor((b - a + 1) * Math.random()) + a;
    },
  },
};
</script>

<style scoped>
button {
  background-color: #7f74b4;
}
</style>