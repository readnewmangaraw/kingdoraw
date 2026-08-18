const fs = require("fs");
const path = require("path");

const payload = JSON.parse(
  fs.readFileSync("/tmp/payload.json", "utf8")
);

if (!payload.title) {
  throw new Error("Missing title");
}

if (!payload.chapter) {
  throw new Error("Missing chapter");
}

if (!payload.slug) {
  throw new Error("Missing slug");
}

if (!payload.language) {
  throw new Error("Missing language");
}

const slug = payload.slug;

const imageDir = path.join(
  process.cwd(),
  "images",
  slug
);

fs.mkdirSync(imageDir, {
  recursive: true
});

const post = {
  title: payload.title,
  chapter: payload.chapter,
  language: payload.language,
  slug: slug,
  cover: `images/${slug}/title.jpg`,
  images: [],
  keywords: Array.isArray(payload.keywords)
    ? payload.keywords
    : [],
  updatedAt: new Date().toISOString()
};


/*
  Title Image
*/

if (payload.titleImage) {

  const titleImage = Buffer.from(
    payload.titleImage,
    "base64"
  );

  fs.writeFileSync(
    path.join(imageDir, "title.jpg"),
    titleImage
  );
}


/*
  Chapter Images
*/

if (Array.isArray(payload.images)) {

  payload.images.forEach((image, index) => {

    const number =
      String(index + 1).padStart(3, "0");

    const filename =
      `${number}.webp`;

    const imageBuffer =
      Buffer.from(image.data, "base64");

    fs.writeFileSync(
      path.join(imageDir, filename),
      imageBuffer
    );

    post.images.push(
      `images/${slug}/${filename}`
    );

  });

}


/*
  Update posts.json
*/

const postsPath =
  path.join(
    process.cwd(),
    "data",
    "posts.json"
  );

let posts = [];

if (fs.existsSync(postsPath)) {

  try {

    posts =
      JSON.parse(
        fs.readFileSync(
          postsPath,
          "utf8"
        )
      );

  } catch {

    posts = [];

  }

}


const existingIndex =
  posts.findIndex(
    item => item.slug === slug
  );


if (existingIndex >= 0) {

  posts[existingIndex] = post;

} else {

  posts.unshift(post);

}


fs.writeFileSync(
  postsPath,
  JSON.stringify(posts, null, 2) + "\n"
);

console.log(
  `Published: ${post.title} Chapter ${post.chapter}`
);
