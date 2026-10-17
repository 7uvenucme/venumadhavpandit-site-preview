---
title: "Shell commands explained like you're 5: the bakery edition (Part 1)"
summary: "What a server is, how to read a shell command, and how to get your code onto one. Explained through a bakery, from the phone line to the recipe book."
date: "2026-10-17"
image: "/images/shell-bakery-header.webp"
imageAlt: "An overhead photo of a pani puri spread on a wooden table"
---

## What is a server?

A server is just a computer that does jobs for other people or other programs. It has no special magic. The difference is how you use it: nobody sits in front of it. It lives somewhere else, stays switched on, and quietly does its work.

Your laptop is like the kitchen at home. It is great for you, but when you close the lid, the cooking stops. A server is a bakery with a shopfront. It keeps baking while you sleep.

## When do you need one?

You need a server when something has to keep running without you:

- A website that anyone can visit at any hour.
- A program that checks something every few minutes, for example prices, data or a queue.
- A tool that other people or apps send requests to.
- Anything you want running even when your laptop is shut or the wifi at home is down.

If you only need something to run when you are sitting there, your own computer is fine. A bakery is for when customers keep coming whether you are around or not.

## The bakery, mapped to a server

In a bakery you store recipes, buy ingredients, put bakers on shifts, check what came out of the oven, and fix problems when orders stop moving. On a server you do the same things with different words.

**The server is the bakery across town.** You are not standing in it. You reach it by phone, and that phone line is called SSH.

**Folders are shelves. Files are recipe cards, stock records or finished reports.** Moving around the server means walking from room to room.

**Code is the recipe.** It is just instructions written down.

**A running process is a baker following a recipe.** Start the program and a baker starts working. Stop it and the baker goes home.

**Dependencies are the ingredients.** A recipe is useless without flour, so a program is useless without the libraries it relies on.

**Logs are the shift diary.** The baker writes down what they did and what went wrong.

**Configuration is the note on the wall** saying which oven, temperature and opening hours to use.

**A process manager (PM2, in Part 2) is the shift manager.** It makes sure a baker is always on shift and replaces one who falls over.

This guide assumes a Linux server, the most common kind. Git, Node.js, npm and PM2 are extra tools, not things every server comes with. The examples are for learning, with made up names and paths. They are not a recipe for operating a live system.

## Actions: bakery versus server

Here is the whole job in a list of everyday actions. Part 1 covers getting in and preparing the kitchen. Part 2 covers running it and looking after it.

- Phone the bakery and get connected: log in with ssh.
- Check which room you are in: pwd, ls, cd.
- Build a shelf, write a recipe card: mkdir, nano, touch.
- Courier a card over, or photocopy the whole recipe book: scp, git clone.
- Order ingredients from the warehouse: npm install.
- Taste test a trial batch: npm test, npm run build.
- Hire a shift manager and put a baker on shift: pm2 start.
- Check the whiteboard and the diary: pm2 list, pm2 logs, tail.
- Send the baker home or call them back: pm2 stop, pm2 restart.
- Hang up the phone: exit. The bakery keeps working.

## Before any command: how to read one

The terminal is the window you type into. The shell is the helper inside it that reads what you type and does it. Think of it as a kitchen assistant who follows exact instructions and never guesses what you meant. A tiny typo means the wrong thing, or nothing.

Almost every command has the same three parts, in this order:

```sh
command  -flags  arguments
ls       -l      bakery-app
```

**1. The command** is the verb, what you want done. Here ls (LiSt). In the bakery: "show me".

**2. Flags (also called options) start with a hyphen.** They change how the command behaves, like telling the assistant "do it slowly" or "with all the details". Here -l means long format. A single hyphen usually goes with a short letter (-l). Two hyphens usually go with a whole word (--lines). Several short flags can be glued together: -la means -l and -a. In the bakery: "show me, in detail".

**3. Arguments are what the command is applied to**: a file name, a folder name, some text. Here it is the folder bakery-app. In the bakery: "show me what is on the bakery-app shelf".

So "ls -l bakery-app" reads as: "show me, in detail, what is on the bakery-app shelf".

Some flags need their own value. In "tail -n 50 app.log", the flag is -n, its value is 50, and the argument is app.log. Reading it: "show me the end, 50 lines, of the app.log diary".

A few more things you will see:

- Spaces separate the parts. A file name with a space in it needs quotes around it.
- Upper and lower case matter. Notes.txt and notes.txt are different cards.
- A path is the address of a card: /home/user/bakery-app/notes.txt. A path that starts with / is the full address from the front door. One that does not is measured from the room you are standing in.
- "." means this room. ".." means the room above. "~" means your own home folder.
- Pressing Enter is what actually sends the instruction. Nothing happens before that.
- Ctrl+C is the emergency "stop what you are doing" key for most things you start in the terminal.

Each command below is shown in the same format: the command with what its name stands for, then what it means in the bakery, what it does on the server, and when you would typically use it.

> **You cannot break the bakery by reading**
>
> Commands that only look (pwd, ls, cat, tail) are safe. The ones to slow down for are the ones that change or remove things: rm, mv, cp over an existing file, and anything with sudo.
> 
> 

## Stage 1: Get into the bakery (access the server)

Nothing else works until you are inside. The bakery is across town, so you phone in, look around, and learn which room you are standing in.

```sh
ssh user@server.example
```

**Name stands for:** ssh = Secure SHell

**In the bakery:** Pick up a private, secure phone line to the bakery across town. Whatever you say on it, the bakery does.

**On the server:** Opens an encrypted connection from your computer to the server and gives you a shell on it. "user" is your login name there and "server.example" is the server address (made up here). It will usually ask for a password or use a key you set up earlier.

**Use it when:** Every session starts here. Your terminal prompt changes after it connects, and that change is your proof you are now typing on the server, not on your own laptop.

```sh
whoami
```

**Name stands for:** whoami = "who am I?" (a sentence squashed into one word)

**In the bakery:** Look at your name badge. Are you the head baker or a visitor?

**On the server:** Prints the name of the account you are logged in as.

**Use it when:** Right after logging in, or before doing anything that depends on permissions. Different accounts can touch different things.

```sh
pwd
```

**Name stands for:** pwd = Print Working Directory

**In the bakery:** "Which room am I in right now?" You read the sign on the door.

**On the server:** Prints the full path of the folder you are currently in, like /home/user/bakery-app.

**Use it when:** After logging in, and before deleting or changing anything. A file with a familiar name in the wrong folder is still the wrong file.

```sh
ls
ls -l
ls -la
```

**Name stands for:** ls = LiSt

**In the bakery:** "Show me what is on this shelf." Plain ls is a quick glance. -l is reading every label up close. -a also shows the cards tucked at the back.

**On the server:** Lists the files and folders in the current folder. -l is the long format (permissions, owner, size, date). -a means all, including hidden names that start with a dot.

**Use it when:** When exploring, or to check whether a file really exists. You will use this one all day.

```sh
cd bakery-app
cd ..
cd ~
cd /
```

**Name stands for:** cd = Change Directory

**In the bakery:** Walk to another room. "cd bakery-app" is walking into the recipe room. ".." is stepping back out one door. "~" is walking to your own desk. "/" is the front door of the entire building.

**On the server:** Moves you into another folder. cd on its own does not move or touch any files. It only changes where you are standing. "~" means your home folder and ".." means the parent folder.

**Use it when:** Before running any command that belongs to a particular project. Most "file not found" errors are just "I am standing in the wrong room".

```sh
exit
```

**Name stands for:** exit = just exit

**In the bakery:** Hang up the phone. The bakery stays open.

**On the server:** Leaves the shell. From a normal SSH login this closes the connection and returns you to your own computer.

**Use it when:** When you are done. Programs managed by a tool like PM2 (in Part 2) keep running after you leave. A program you started directly in the shell may stop.

## Stage 2: Set up the kitchen (write and deploy a program)

Now you are in. To get a program running you need a recipe (code), a place to store it, the ingredients it depends on, and a way to check it before opening the doors.

```sh
mkdir bakery-app
```

**Name stands for:** mkdir = MaKe DIRectory

**In the bakery:** Build a new shelf and label it.

**On the server:** Creates a new, empty folder.

**Use it when:** At the start of a project, or whenever you want a tidy place for new files.

```sh
touch notes.txt
```

**Name stands for:** touch = "touch" the file (no acronym)

**In the bakery:** Place a blank recipe card on the shelf. If the card already exists, you just stamp today's date on it.

**On the server:** Creates an empty file if it does not exist. If it does, it only updates its "last modified" time.

**Use it when:** To make a placeholder file quickly, before you fill it in with an editor.

```sh
nano notes.txt
```

**Name stands for:** nano = a small text editor (the name is a play on an older editor called pico)

**In the bakery:** Sit at the desk with a pen and write or edit the recipe card, right there in the bakery.

**On the server:** Opens a simple text editor inside the terminal. The shortcuts are listed at the bottom: Ctrl+O saves, Ctrl+X exits.

**Use it when:** For a quick edit to a small file on the server. Beginner friendly. vim is a more powerful editor that is harder to learn (its full name is Vi IMproved), so it is fine to skip it for now.

```sh
scp notes.txt user@server.example:/home/user/
```

**Name stands for:** scp = Secure CoPy

**In the bakery:** Send a recipe card to the bakery across town by courier in a locked box.

**On the server:** Copies a file between your computer and the server over the same secure connection that SSH uses. Run it on your own computer, not inside the SSH session. The part after the colon is the folder on the server.

**Use it when:** When you have a file on your laptop and need it on the server, or the other way round.

```sh
git clone https://example.com/bakery-app.git
```

**Name stands for:** git = a version control tool (a made-up name, commonly joked about as "global information tracker"). clone = make a full copy

**In the bakery:** Photocopy the entire recipe book, including its full history of changes, and bring it to this bakery.

**On the server:** Downloads a project and its history from a code hosting site into a new folder. The address is made up here.

**Use it when:** The first time you put a project on a server. Your code lives in git, and the server gets its own copy.

```sh
git status
git diff
```

**Name stands for:** status = state of things; diff = DIFFerence

**In the bakery:** status: "Which cards have I scribbled on since the last clean copy?" diff: "Show me exactly what I changed on each card."

**On the server:** git status lists changed and new files. git diff shows the line by line changes.

**Use it when:** Before saving a change, and whenever you are unsure what state the server copy is in.

```sh
git pull --ff-only
```

**Name stands for:** pull = bring changes down; ff = Fast-Forward

**In the bakery:** The head office sends updated recipes. You take the updates and add them to your book, but only if they slot in cleanly on top of what you have. If your book has its own scribbles that clash, you stop and ask first.

**On the server:** Downloads new commits and moves your copy forward. --ff-only refuses to do anything messy and tells you instead.

**Use it when:** To bring the latest version of the code onto the server. Note that pulling updates the files on disk, but a program that is already running keeps using the old recipe until you restart it.

```sh
git add notes.txt
git commit -m "Explain oven lock"
git push
```

**Name stands for:** add = stage; commit = save a snapshot; -m = message; push = send up

**In the bakery:** add: put the card in the "ready to file" tray. commit: file it in the recipe book with a short note on why. push: mail the updated book to head office.

**On the server:** Three steps to record and share a change. The text in quotes after -m is your note to your future self.

**Use it when:** When you changed code and want to save and share it. Usually done on your laptop, not on the server.

```sh
cat notes.txt
```

**Name stands for:** cat = conCATenate (it can join files together, but mostly it just shows them)

**In the bakery:** Read the whole recipe card out loud.

**On the server:** Prints the full text of a file to the screen.

**Use it when:** For short files like notes or settings. For a huge file use head or tail instead, so it does not flood your screen. Never paste files with passwords into chats or blogs.

```sh
cp settings.json settings.backup.json
```

**Name stands for:** cp = CoPy

**In the bakery:** Throw a card in the bin. There is no bin to dig through later.

**On the server:** Deletes a file. On most servers there is no trash can to recover from. -i asks "are you sure?" first.

**Use it when:** Rarely, and slowly. Run pwd and ls first, so you know what you are deleting and where.

```sh
chmod u+x script.sh
```

**Name stands for:** chmod = CHange MODe

**In the bakery:** Change who is allowed to use a tool. u+x means "give the owner (user) permission to eXecute it".

**On the server:** Changes a file's permissions. A script must be marked executable before you can run it directly.

**Use it when:** When a script says "permission denied" because it is not marked as a program. Do not open files to everyone as a quick fix.

```sh
npm install
npm ci
```

**Name stands for:** npm = Node Package Manager; ci = Clean Install

**In the bakery:** Order ingredients from the warehouse according to the recipe's shopping list. install goes shopping. ci throws out your old stock and buys exactly what the locked list says.

**On the server:** Downloads the libraries your Node.js program depends on. ci follows the project's lock list exactly, which makes the server match the version you tested.

**Use it when:** After cloning a project or after the shopping list changed. This applies if your program uses Node.js. Other languages have their own versions of this.

```sh
npm test
npm run build
```

**Name stands for:** npm run = run a named job from the project's own list

**In the bakery:** Do a taste test on a trial batch, then pack the products as the shop expects them.

**On the server:** Runs the project's own checks, and its own build step. What exactly happens depends on that project.

**Use it when:** Before you start the program for real. If the test fails, you found out in the kitchen, not in front of customers.

## Where Part 2 picks up

You can now get in, find your way around, and put your code and its dependencies on a server. In Part 2 we will open the shop: start a program, keep it running after you leave, read its logs and check what went wrong.

## Keep learning

Technical references: [Linux command guide](https://developers.redhat.com/cheat-sheets/linux-commands-cheat-sheet), [Bash shell](https://man7.org/linux/man-pages/man1/bash.1.html), [Git tutorial](https://git-scm.com/docs/gittutorial), [npm commands](https://docs.npmjs.com/cli/v11/commands), [PM2 quick start](https://pm2.keymetrics.io/docs/usage/quick-start/), and [OpenSSH manuals](https://www.openssh.org/manual.html).
