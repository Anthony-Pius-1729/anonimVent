import uuid from "react-native-uuid";

export const generateUserName = (): string => {
  const userId: string = uuid.v4() as string;
  const animals: string[] = [
    "Koala",
    "Kangaroo",
    "Fox",
    "Penguin",
    "Otter",
    "Tiger",
    "Panda",
    "Wolf",
    "Hedgehog",
    "Eagle",
    "Lion",
    "Bear",
    "Dolphin",
    "Owl",
    "Rabbit",
    "Squirrel",
    "Raccoon",
    "Cheetah",
    "Leopard",
    "Horse",
    "Elephant",
    "Giraffe",
    "Zebra",
    "Meerkat",
    "Chimpanzee",
    "Gorilla",
    "Monkey",
    "Sloth",
    "Armadillo",
    "Platypus",
    "Llama",
    "Alpaca",
    "Falcon",
    "Hawk",
    "Parrot",
    "Toucan",
    "Crow",
    "Swan",
    "Seal",
    "Walrus",
    "Shark",
    "Whale",
    "Octopus",
    "Crab",
    "Lobster",
    "Jellyfish",
    "Starfish",
    "Frog",
    "Toad",
    "Salamander",
    "Turtle",
    "Tortoise",
    "Snake",
    "Cobra",
    "Viper",
    "Crocodile",
    "Alligator",
    "Beaver",
    "Moose",
    "Deer",
    "Bison",
    "Buffalo",
    "Hyena",
    "Lynx",
    "Ocelot",
  ];

  const prefixName: string =
    animals[Math.floor(Math.random() * animals.length)];

  const username: string = prefixName + "-" + userId;

  return username;
};


