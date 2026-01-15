---
title: React Native forms with Formik
timestamp: 2020-04-13 20:06:48+01:00
tags: [React Native, Formik, Form, React]
description: Building complex forms with formik
toc: true
draft: false
---

I really don't know how to start this article cause this is my first.
So I had just recently gone through the react native documentation and was going to build my first React Native app. I had gone through a lot of tutorials on working with forms in react native and the suggested tool was redux-form, Redux form was all fun until we built the app and the form section was lagging. Long story cut short I found formik (LOML), but the documentation on React Native was quite short, well I got hacking then fell in love.

Things I assume you know
Assumptions -
  Javascript (ES6)
  React
  A little bit of React Native
*We won't worry too much about styling as this post is about Formik and it's functionalities😌*

So first things first, let's initialize an empty React Native project.

```shell
expo init Formik-tut --template=blank
```

Expo would ask for the package manager to use (Yarn or Npm) choose your preferred choice.
This would set up a simple react native project. We change directory to the Formik-tut so we can start hacking away.

```shell
  cd Formik-tut
```

Then we install the necessary dependencies for this project.

```shell
  npm install yup formik prop-types --save
```

Run the app by running

```shell
  expo start
```

This would start up an expo local server and would also open the local server webpage. Run the app on your preferred simulator by pressing i for iOS, a for android in the terminal.

The main file is App.js

```jsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

Let's create components that we would use

```shell
mkdir components && touch Input.js && cd ..
```

Then edit the content of components/Input.js

```jsx
import React from "react";
import { View, TextInput, StyleSheet, Text } from "react-native";
import PropTypes from "prop-types";

const Input = ({
  label,
  inputStyle,
  containerStyle,
  touched,
  error,
  ...props
}) => {
  return (
    <View style={containerStyle}>
      <Text>{label}</Text>
      <TextInput style={inputStyle} {...props} />
      <Text style={styles.errorInput}>{touched && error}</Text>
    </View>
  );
};

// This creates an object of styles using React Native StyleSheet
const styles = StyleSheet.create({
  containerStyle: {
    marginVertical: 5,
  },
  input: {
    borderBottomWidth: 1,
    minHeight: 40,
    padding: 10,
  },
  errorInput: { color: "red", fontSize: 12 },
});

// this made me thing about TypeScript
// and what it was created to solve😅
const stylePropsType = PropTypes.oneOfType([
  PropTypes.arrayOf(PropTypes.object),
  PropTypes.object,
]);

Input.propTypes = {
  inputStyle: stylePropsType,
  containerStyle: stylePropsType,
  ...TextInput.propTypes, // this makes the Input component have proptypes of Textinput
};
Input.defaultProps = {
  inputStyle: styles.input,
  containerStyle: styles.containerStyle,
  touched: false,
  error: null,
};

export default Input;

```

After doing this

In *Input.js* we create a simple Textinput component, in this, we have a View and Textinput component, and we give the component the ability to change styles by passing inputStyle, containerStyle as props.

Let's go back to App.js to use our newly created Input component, App.js becomes

```jsx
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Button } from "react-native";
import Input from "./components/Input";
import { Formik } from "formik";

export default function App() {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.header}>Create Account</Text>
        <Text style={styles.subHeader}>
          Create a new account and let me show you the world
        </Text>
      </View>
      <View>
        <Input label="Username" />
        <Input label="Email" />
        <Input label="Phone" />
        <Input label="Password" />
        <Input label="Confirm Password" />
      </View>
      <View style={styles.formAction}>
        <Text style={styles.conditionText}>
          By continuing you agree with our Terms and Condition
        </Text>
        <Button title="Create Account"></Button>
        <View style={styles.signIn}>
          <Text>Already have an account?</Text>
          <TouchableOpacity>
            <Text style={styles.signInText}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f3f3",
    // alignItems: "center",
    // justifyContent: "center",
    padding: 10,
    paddingTop: 64
  },
  header: {
    fontSize: 28,
    textAlign: "center",
    marginVertical: 10
  },
  subHeader: {
    fontSize: 18,
    textAlign: "center",
    marginVertical: 15
  },
  formAction: {},
  conditionText: {
    marginVertical: 10,
    textAlign: "center"
  },
  signIn: {
    flexDirection: "row",
    justifyContent: "center"
  },
  signInText: {
    color: "rgb(51,130,246)"
  }
});

```

Let's create our Button component

```shell
  mkdir components && touch Button.js && cd ..
```

Edit your Button file

```jsx
import React from "react";
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from "react-native";
import PropTypes from "prop-types";

const Button = ({
  text,
  instructions,
  containerStyle,
  textStyle,
  isSubmitting,
  disabled,
  indicatorColor,
  ...props
}) => {
  return (
    <TouchableOpacity
      onPress={() => {
        if (instructions) instructions();
      }}
      disabled={disabled || isSubmitting}
      style={containerStyle}
    >
      {isSubmitting ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        <Text style={textStyle}>{text}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    marginVertical: 10,
    backgroundColor: "grey",
    paddingVertical: 10,
    borderRadius: 5
  },
  textStyle: {
    textAlign: "center",
    color: "white",
    fontSize: 20
  }
});

Button.defaultProps = {
  text: "",
  isSubmitting: false,
  indicatorColor: "white",
  ...styles // this would spread the styles object
};

const stylePropsType = PropTypes.oneOfType([
  PropTypes.arrayOf(PropTypes.object),
  PropTypes.object
]);

Button.propTypes = {
  containerStyle: stylePropsType,
  textStyle: stylePropsType
};

export default Button;

```

Now let's get down to Formik.

App.js now becomes

```jsx

// code can be found in an earlier code snippet

export default function App() {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.header}>Create Account</Text>
        <Text style={styles.subHeader}>
          Create a new account and let me show you the world
        </Text>
      </View>
      <Formik
        initialValues={{
          email: "",
          username: "",
          phone: "",
          password: "",
          confirm_password: ""
        }}
        onSubmit={values => console.log(values)}
      >
        {({ handleChange, handleBlur, handleSubmit, values, touched, errors, isSubmitting  }) => {
          return (
            <>
              <View>
                <Input
                  onChangeText={handleChange("username")}
                  onBlur={handleBlur("username")}
                  value={values.username}
                  label="Username"
                />
                <Input
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  value={values.email}
                  label="Email"
                />
                <Input
                  onChangeText={handleChange("phone")}
                  onBlur={handleBlur("phone")}
                  value={values.phone}
                  label="Phone"
                />
                <Input
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  value={values.password}
                  label="Password"
                />
                <Input
                  onChangeText={handleChange("confirm_password")}
                  onBlur={handleBlur("confirm_password")}
                  value={values.confirm_password}
                  label="Confirm Password"
                />
              </View>
              <View style={styles.formAction}>
                <Text style={styles.conditionText}>
                  By continuing you agree with our Terms and Condition
                </Text>
                <Button onPress={handleSubmit} text="Create Account" />
                <View style={styles.signIn}>
                  <Text>Already have an account?</Text>
                  <TouchableOpacity>
                    <Text style={styles.signInText}> Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          );
        }}
      </Formik>
    </View>
  );
}
```

So we give formik the initial value of the form, then we get data of the form like values (values of the form), touched (form elements that has been touched), errors (errors caught while validating the form), isSubmitting (Boolean showing the state of submission), and gives us functions like resetForm, handleSubmit, handleChange, e.t.c.
We pass in a prop called onSubmit which takes in a function, onSubmit is a function that handles submission of the values to your server or what ever you want to do with it. I would advise you to make this function an async function if you are going to submit the values to a server, this gives you the ability to await the result and can be used to hold subsequent submission to the server with the isSubmitting value exposed by formik.
An Example:

```jsx
<View style={styles.container}>
      // ...
      <Formik
        initialValues={{
          email: "",
          username: "",
          phone: "",
          password: "",
          confirm_password: "",
        }}
        onSubmit={async (values) => {
          await FuncWillTake5Secs();
           // as this would take 5 sec this would stop the user from submitting the form again
           // for more clarity look into the Button Component
        }}
      >
        {({ isSubmitting, ...rest }) => {
          return (
            <>
              <View>
                // ...
                {/* look into Button */}
                <Button
                  onPress={handleSubmit}
                  text="Create Account"
                  {...{ isSubmitting }}
                />
                // ...
              </View>
            </>
          );
        }}
      </Formik>
    </View>
```

You can also run Validation which is a big deal, we handle validation by passing a prop called validate which takes a function with the values of the form as it only argument and returns an object.

```jsx
// ... rest

const validate = (values) => {
  const errors = {};
  if (!values.username) {
    errors.username = "Required";
  } else if (values.username.length < 4) {
    errors.username = "Minimun length of 4";
  }
  if (!values.phone) {
    errors.phone = "Required";
  } else if (values.phone.match(/\d/g).length === 11) {
    errors.phone = "Minimun length of 11";
  }
  if (!values.password) {
    errors.password = "Required";
  } else if (values.password.length < 8) {
    errors.password = "Minimun length of 8";
  }
  if (!values.confirm_password) {
    errors.confirm_password = "Required";
  } else if (values.confirm_password.length < 8) {
    errors.confirm_password = "Minimun length of 8";
  } else if (
    !!values.password &&
    !!values.confirm_password &&
    values.password != values.confirm_password
  ) {
    errors.confirm_password = "Not equal to Password";
  }
  if (!values.email) {
    errors.email = "Required";
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = "Invalid email address";
  }
  return errors;
};
  // ...
  <Formik 
  validate={validate}
  >
  //...

```

We can then use the value of the error by doing this

```jsx
               // by passing touched and error     
               <Input
                  onChangeText={handleChange("username")}
                  onBlur={handleBlur("username")}
                  value={values.username}
                  touched={touched.username}
                  error={errors.username}
                  label="Username"
                />
```

I'm sure you are happy and ready to go into the world to show react native forms that you are a master, but this isn't even the fun part, the fun part is assigning yup to handle validation. Adding yup to handle validation is like bring Thanos to a fist fight 😌. So let's use yup.
![Thanos Snaps](https://dev-to-uploads.s3.amazonaws.com/i/r0v9h27h3bbswym14t4k.gif)
If you haven't heard of Yup checkout [https://medium.com/@rossbulat/introduction-to-yup-object-validation-in-react-9863af93dc0e](https://medium.com/@rossbulat/introduction-to-yup-object-validation-in-react-9863af93dc0e).

```jsx
// ...
import * as Yup from "yup";

const SignupSchema = Yup.object().shape({
  username: Yup.string().min(4, "Minimun length of 4").required("Required"),
  phone: Yup.string()
    .min(11, "Minimun length of 11")
    .max(11, "Minimun length of 11")
    .required("Required"),
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(8, "Minimun length of 8").required("Required"),
  confirm_password: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .min(8, "Minimun length of 8")
    .required("Required"),
});

// ...
      <Formik
        validationSchema={SignupSchema}

//...
```

Formik and yup makes handling with formik a breeze, but as we all know, the world isn't a simple place and something we would have to work with complex forms like triggering validation when some conditions are met or formatting the text input to add dash in card number text input, all these can easily be handled by formik as it has made a lot of things real easy and incase you are wondering formik does have redux intergration.
You can find the codebase here [https://github.com/benjamin-daniel/Formik-tut](https://github.com/benjamin-daniel/Formik-tut).
Thank you for reading.
