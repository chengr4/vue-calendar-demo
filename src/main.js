import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import firebase from "firebase/app";
import "firebase/firestore";
import VueTextareaAutosize from "vue-textarea-autosize";

Vue.use(VueTextareaAutosize);

Vue.config.productionTip = false;

firebase.initializeApp({
  apiKey: "AIzaSyAGcYEnmk7AZid-kNzuKSJz7TP8PQxrLjk",
  authDomain: "vue-calendar-demo-92950.firebaseapp.com",
  databaseURL: "https://vue-calendar-demo-92950-default-rtdb.firebaseio.com",
  projectId: "vue-calendar-demo-92950",
  storageBucket: "vue-calendar-demo-92950.appspot.com",
  messagingSenderId: "22526565833",
  appId: "1:22526565833:web:4e855c3ac79821fa609c18",
  measurementId: "G-MBSVRR5XT2",
});

export const db = firebase.firestore();

new Vue({
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
