[![npm](https://img.shields.io/npm/v/typed.ts?color=%2300d26a&style=for-the-badge)](https://www.npmjs.com/package/typed.ts)
[![CI](https://img.shields.io/github/workflow/status/LoaderB0T/typed.ts/CI/main?style=for-the-badge)](https://github.com/LoaderB0T/typed.ts/actions/workflows/build.yml)
[![Sonar Quality Gate](https://img.shields.io/sonar/quality_gate/LoaderB0T_typed.ts?server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge)](https://sonarcloud.io/summary/new_code?id=LoaderB0T_typed.ts)

# typed.ts

Realistic typing simulations in TypeScript!

## Motivation 💥

This small package provides simple typing simulations for TypeScript or JavaScript. It does not aim to modify the DOM directly, but rather only calculates the strings and provides a callback for you to render.

## Example 🧮

<p align="center">
  <img src="readme/example.gif" height="350">
</p>

## Features 🔥

✅ Simulates typing for any strings

✅ Includes realistic errors and automatic corrections

✅ Configurable typing speed, delay, erase speed, error rate, and more

✅ Custom class names for sections of the string

✅ Add new keyboard layouts and custom characters

✅ No DOM manipulation -> use with any framework (in fact, you don't even need a DOM)

✅ Promise based for easy async usage

✅ Zero dependencies

This project is meant to be lightweight. You will need to write a couple lines of code to integrate it in your app. This is by design.

## Built With 🔧

- [TypeScript](https://www.typescriptlang.org/)

## Getting Started 🚀

```typescript
import { Typed } from 'typed.ts';

const typed = new Typed({ callback: text => console.log(text) });

const line1 = 'Hello, World!';
const line2 = 'slow';
const line3 = 'this is typed really fast, but errors are slow';
const line4 = 'this line is fast forwarded. No errors will be made';

const type = async () => {
  typed
    .type(line1)
    .backspace(line1.length)
    .type(line2, { perLetterDelay: { min: 200, max: 400 } })
    .backspace(line2.length)
    .type(line3, { eraseDelay: { min: 40, max: 80 }, perLetterDelay: { min: 200, max: 400 } })
    .backspace(line3.length);

  typed.fastForward();
  await typed.run();
  await typed.reset(true);
  typed.type(line4);
  await typed.run();
};

type();
```

## Contributing 🧑🏻‍💻

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 🔑

Distributed under the MIT License. See `LICENSE.txt` for more information.

## Contact 📧

Janik Schumacher - [@LoaderB0T](https://twitter.com/LoaderB0T) - [linkedin](https://www.linkedin.com/in/janikschumacher/)

Project Link: [https://github.com/LoaderB0T/typed.ts](https://github.com/LoaderB0T/typed.ts)
