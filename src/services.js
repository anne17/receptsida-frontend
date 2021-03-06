import Vue from "vue"
export const EventBus = new Vue()

import axios from "axios"
axios.defaults.withCredentials = true
export { axios }

export const GetRecipeMixin = {
  // Get the correct query string for the backend call from the 'url' param
  // which can be a pretty URL with an ID or a recipe title (old format).
  methods: {
    getRecipeParams() {
      let urlarray = this.$route.params.url.split("-")
      let id = parseInt(urlarray[urlarray.length - 1])
      if (!isNaN(id)) {
        return { id: id }
      } else {
        return { title: this.$route.params.url }
      }
    }
  }
}

export const ImageMixin = {
  // Get URL for image in correct size
  methods: {
    getImgUrl(recipe_data, mode = "full") {
      let path = this.$imagePath
      if (mode === "thumb") {
        path = this.$thumbnailPath
      } else if (mode === "medium") {
        path = this.$mediumImagePath
      }
      if (recipe_data.image !== undefined && recipe_data.image !== "") {
        return path + recipe_data.image
      } else if (recipe_data.title !== undefined && recipe_data.title !== "") {
        return path + this.$defaultimg
      }
    }
  }
}

export const LoginMixin = {
  // Provides functionality for checking authentication
  data() {
    return {
      loggedIn: false,
      admin: false,
      currentUser: "",
      hasSuggestions: false,
      suggestions: [],
      nSuggestions: -1
    }
  },
  created() {
    EventBus.$on("login", this.updateLoginStatus)
    // Check if there are suggestions still after saving
    EventBus.$on("save", this.getSuggestions)
    this.checkLogin()
  },
  methods: {
    checkLogin() {
      axios
        .post(this.$backend + "check_authentication")
        .then(response => {
          if (response.data.authenticated == true) {
            this.loggedIn = true
            this.currentUser = response.data.user
            if (response.data.admin == true) {
              this.admin = true
              this.getSuggestions()
            } else {
              this.admin = false
              this.hasSuggestions = false
              this.nSuggestions = -1
            }
          } else {
            this.setAllLogout()
          }
        })
        .catch(error => {
          this.setAllLogout()
          console.error(error)
        })
    },
    updateLoginStatus(authObject) {
      if (authObject.authenticated == true) {
        this.loggedIn = true
        this.currentUser = authObject.user
        if (authObject.admin == true) {
          this.admin = true
          this.getSuggestions()
        } else {
          this.admin = false
        }
      } else {
        if (this.$route.name == "edit" || this.$route.name == "suggest") {
          this.$router.push({ name: "recipes" })
        }
        this.setAllLogout()
      }
    },
    getSuggestions() {
      axios
        .get(this.$backend + "recipe_suggestions")
        .then(response => {
          if (response.data.status !== "success") {
            this.hasSuggestions = false
          } else {
            this.nSuggestions = response.data.hits
            if (this.nSuggestions > 0) {
              this.hasSuggestions = true
              this.suggestions = response.data.data
            } else {
              this.hasSuggestions = false
            }
          }
        })
        .catch(e => {
          console.error("Response from backend:", e.response)
          this.hasSuggestions = false
        })
    },
    setAllLogout() {
      this.loggedIn = false
      this.currentUser = ""
      this.admin = false
      this.hasSuggestions = false
      this.nSuggestions = -1
    }
  }
}

export const TagMixin = {
  // Provides functionality for getting tags and categories from the backend
  data() {
    return {
      tagCategories: [],
      tagStructure: [],
      tagStructureSimple: [],
      tagList: []
    }
  },
  created() {
    this.getTagCategories()
  },
  methods: {
    getTagCategories() {
      axios
        .get(this.$backend + "get_tag_categories")
        .then(response => {
          if (response.data.status == "success") {
            for (var i in response.data.data) {
              Vue.set(this.tagCategories, i, response.data.data[i])
            }
          }
        })
        .catch(e => {
          console.error("Response from backend:", e.response)
        })
    },
    getTagStructure() {
      axios
        .get(this.$backend + "get_tag_structure")
        .then(response => {
          if (response.data.status == "success") {
            for (var i in response.data.data) {
              Vue.set(this.tagStructure, i, response.data.data[i])
            }
          }
        })
        .catch(e => {
          console.error("Response from backend:", e.response)
        })
    },
    getTagStructureSimple() {
      return axios
        .get(this.$backend + "get_tag_structure_simple")
        .then(response => {
          if (response.data.status == "success") {
            var tagCounter = 0
            for (var i in response.data.data) {
              Vue.set(this.tagStructureSimple, i, response.data.data[i])
              for (var j in response.data.data[i].tags) {
                Vue.set(this.tagList, tagCounter, response.data.data[i].tags[j])
                tagCounter++
              }
            }
          }
        })
        .catch(e => {
          console.error("Response from backend:", e.response)
        })
    }
  }
}
