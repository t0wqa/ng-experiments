import {Component, OnInit} from '@angular/core';
import * as Diff from 'diff';

const CORRECTNESS_CORRECT_FULLY = 0;
const CORRECTNESS_CORRECT_PARTIALLY = 1;
const CORRECTNESS_INCORRECT = 2;
const CORRECTNESS_OVERRIDE = 10;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = '';
  correctAnswers = [
    'cow',
    'is',
    'Steak',
    'Guarantee',
    'Compete',
    'Good bye',
    'I am doctor',
    'It is rainy here',
    'In my dreams I can fly'
  ];
  chosenAnswerIdToValidate = 0;
  diff = [];
  correctness = 0;

  result: {
    correctness: number,
    mistakesCount: number,
    analyzed: {
      words: {
        correctness: number,
        mistakesCount: number,
        mistakesAtTheEndCount: number,
        correctAnswerWord: string,
        diff: {}[]
      }[],
    }
  } = {
    correctness: CORRECTNESS_CORRECT_FULLY,
    mistakesCount: 0,
    analyzed: {
      words: []
    }
  };

  ngOnInit() {}

  onSelect(event) {
    this.chosenAnswerIdToValidate = Number(event.target.value);
  }

  onValidate() {
    const correctAnswer = this.correctAnswers[this.chosenAnswerIdToValidate];
    this.validate(this.title, correctAnswer);
    this.aggregateCorrectness();
    console.log(this.result);
  }

  validate(input: string, correctAnswer: string) {
    const inputWords = input.split(' ').filter(word => !!word);

    if (inputWords.length === 1) {
      const singleWordResult = this.validateSingleWord(inputWords[0], correctAnswer);
      this.result = {
        correctness: singleWordResult.correctness,
        mistakesCount: singleWordResult.mistakesCount,
        analyzed: {
          words: [
            {
              correctness: singleWordResult.correctness,
              diff: singleWordResult.diff,
              mistakesCount: singleWordResult.mistakesCount,
              mistakesAtTheEndCount: singleWordResult.mistakesAtTheEndCount,
              correctAnswerWord: singleWordResult.correctAnswerWord
            }
          ]
        }
      };
      return;
    }

    const multipleWordResult = this.validateMultipleWords(inputWords, correctAnswer);
    this.result = {
      correctness: multipleWordResult.correctness,
      mistakesCount: multipleWordResult.mistakesCount,
      analyzed: {
        words: inputWords.map(word => {
          return this.validateSingleWord(word, this.getCorrectedWord(word, correctAnswer));
        })
      }
    };
  }

  aggregateCorrectness() {
    let correctness = this.result.correctness;

    if (correctness === CORRECTNESS_INCORRECT) {
      return;
    }

    if (this.result.analyzed.words.length === 2) {
      this.result.analyzed.words.forEach(item => {
        if (item.correctAnswerWord.length >= 1 && item.correctAnswerWord.length <= 3) {
          if (item.mistakesCount >= 1) {
            correctness = CORRECTNESS_INCORRECT;
          }
        }
      });
    }

    if (this.result.analyzed.words.length === 3 || this.result.analyzed.words.length === 4) {
      this.result.analyzed.words.forEach(item => {
        if (correctness === CORRECTNESS_CORRECT_PARTIALLY && item.correctness >= CORRECTNESS_CORRECT_PARTIALLY) {
          correctness = CORRECTNESS_INCORRECT;
        }
      });
    }

    if (this.result.analyzed.words.length >= 5) {
      let mistakesCount = 0;

      this.result.analyzed.words.forEach(item => {
        mistakesCount = mistakesCount + item.mistakesCount;
      });

      if (correctness === CORRECTNESS_CORRECT_PARTIALLY && mistakesCount >= 2) {
        correctness = CORRECTNESS_INCORRECT;
      }
    }

    this.result.correctness = correctness;
  }

  validateMultipleWords(inputWords: string[], correctAnswer: string) {
    const correctedInput = this.getCorrectedWords(inputWords, correctAnswer).join(' ');
    const wordsDiff = Diff.diffWords(correctedInput, correctAnswer, {ignoreCase: true});

    const correctAnswerWords = correctAnswer.split(' ').filter(word => !!word);
    let mistakesCount = 0;
    let correctness = CORRECTNESS_CORRECT_FULLY;

    wordsDiff.forEach((part, index) => {
      if (part.added || part.removed) {
        const correctingPart = wordsDiff[index + 1] ?? null;
        const correctedPart = wordsDiff[index - 1] ?? null;

        if (part.added && correctingPart !== null && !!correctingPart.removed) {
          mistakesCount = mistakesCount + part.value.split(' ').filter(word => !!word).length;
        }

        if (part.added && correctedPart !== null && !!correctedPart.removed) {

        }

        if (part.removed && correctingPart !== null && !!correctingPart.added) {
          mistakesCount = mistakesCount + part.value.split(' ').filter(word => !!word).length;
        }

        if (part.removed && correctedPart !== null && !!correctedPart.added) {

        }

        if (part.added && !correctedPart?.removed && !correctingPart?.removed) {
          mistakesCount = mistakesCount + part.value.split(' ').filter(word => !!word).length;
        }

        if (part.removed && !correctedPart?.added && !correctingPart?.added) {
          mistakesCount = mistakesCount + part.value.split(' ').filter(word => !!word).length;
        }
      }
    });

    console.log('hi', wordsDiff);

    if (correctAnswerWords.length === 2) {
      if (mistakesCount >= 1) {
        correctness = 2;
      } else {
        correctness = 0;
      }
    }

    if (correctAnswerWords.length === 3 || correctAnswerWords.length === 4) {
      console.log('hi', mistakesCount);
      if (mistakesCount === 0) {
        correctness = CORRECTNESS_CORRECT_FULLY;
      }

      if (mistakesCount === 1) {
        correctness = CORRECTNESS_CORRECT_PARTIALLY;
      }

      if (mistakesCount > 1) {
        correctness = CORRECTNESS_INCORRECT;
      }
    }

    if (correctAnswerWords.length >= 5) {
      if (mistakesCount >= 3) {
        correctness = CORRECTNESS_INCORRECT;
      }

      if (mistakesCount <= 2) {
        correctness = CORRECTNESS_CORRECT_PARTIALLY;
      }

      if (mistakesCount === 0) {
        correctness = CORRECTNESS_CORRECT_FULLY;
      }
    }

    console.log(wordsDiff, mistakesCount, 'mistake words count');
    return {
      diff: wordsDiff,
      correctness,
      mistakesCount
    };
  }

  validateSingleWord(word: string, correctAnswer: string) {
    const correctAnswerWords = correctAnswer.split(' ').filter(answerWord => !!answerWord);

    let correctAnswerWord = correctAnswerWords[0];

    const firstAnswerWordDiff = Diff.diffChars(word, correctAnswerWords[0], {ignoreCase: true});
    let firstAnswerWordMistakesCount = 0;

    firstAnswerWordDiff.forEach(part => {
      if (part.added || part.removed) {
        firstAnswerWordMistakesCount = firstAnswerWordMistakesCount + part.count;
      }
    });

    correctAnswerWords.forEach(answerWord => {
      const diff = Diff.diffChars(word, answerWord, {ignoreCase: true});
      let localMistakesCount = 0;

      diff.forEach(part => {
        if (part.added || part.removed) {
          localMistakesCount = localMistakesCount + part.count;
        }
      });

      if (localMistakesCount < firstAnswerWordMistakesCount) {
        correctAnswerWord = answerWord;
        firstAnswerWordMistakesCount = localMistakesCount;
      }
    });

    const wordsDiff = Diff.diffChars(word, correctAnswerWord, {ignoreCase: true});
    let mistakesCount = 0;
    let mistakesAtTheEndCount = 0;

    wordsDiff.forEach((part, index) => {
      if (part.added || part.removed) {
        const correctingPart = wordsDiff[index + 1] ?? null;
        const correctedPart = wordsDiff[index - 1] ?? null;

        if (part.added && correctingPart !== null && !!correctingPart.removed) {
          mistakesCount = mistakesCount + part.count;
        }

        if (part.added && correctedPart !== null && !!correctedPart.removed) {

        }

        if (part.removed && correctingPart !== null && !!correctingPart.added) {
          mistakesCount = mistakesCount + part.count;
        }

        if (part.removed && correctedPart !== null && !!correctedPart.added) {

        }

        if (part.added && !correctedPart?.removed && !correctingPart?.removed) {
          mistakesCount = mistakesCount + part.count;
        }

        if (part.removed && !correctedPart?.added && !correctingPart?.added) {
          mistakesCount = mistakesCount + part.count;
        }

        if ((part.added || part.removed) && !correctingPart) {
          mistakesAtTheEndCount = mistakesAtTheEndCount + part.count;
        }
      }
    });

    console.log(wordsDiff, mistakesCount, 'mistakes count');

    let correctness = 0;

    if (correctAnswerWord.length <= 3) {
      if (mistakesCount > 0) {
        this.correctness = 2;
        correctness = 2;
      } else {
        this.correctness = 0;
        correctness = 0;
      }
    } else if (correctAnswerWord.length >= 4 && correctAnswerWord.length <= 6) {
      if (mistakesCount === 0) {
        this.correctness = 0;
        correctness = 0;
      }
      if (mistakesCount === 1) {
        if (wordsDiff[wordsDiff.length - 1].added || wordsDiff[wordsDiff.length - 1].removed) {
          this.correctness = 2;
          correctness = 2;
        } else {
          this.correctness = 1;
          correctness = 1;
        }
      }
      if (mistakesCount >= 2) {
        this.correctness = 2;
        correctness = 2;
      }
    } else if (correctAnswerWord.length > 6) {
      if (mistakesCount === 0) {
        this.correctness = 0;
        correctness = 0;
      }

      if (mistakesCount >= 1) {
        if (mistakesCount === 1 || mistakesCount === 2) {
          this.correctness = 1;
          correctness = 1;
        }

        if (mistakesCount > 2) {
          this.correctness = 2;
          correctness = 2;
        }

        if (wordsDiff[wordsDiff.length - 1].added || wordsDiff[wordsDiff.length - 1].removed) {
          this.correctness = 2;
          correctness = 2;
        }
      }
    }

    return {
      diff: wordsDiff,
      correctness,
      mistakesCount,
      mistakesAtTheEndCount,
      correctAnswerWord
    };
  }

  getCorrectedWords(inputWords: string[], correctAnswer: string) {
    return inputWords.map(word => {
      return this.getCorrectedWord(word, correctAnswer);
    });
  }

  getCorrectedWord(word: string, correctAnswer: string) {
    const correctAnswerWords = correctAnswer.split(' ').filter(answerWord => !!answerWord);

    let correctAnswerWord = null;

    const firstAnswerWordDiff = Diff.diffChars(word, correctAnswerWords[0], {ignoreCase: true});
    let firstAnswerWordMistakesCount = 0;

    firstAnswerWordDiff.forEach(part => {
      if (part.added || part.removed) {
        firstAnswerWordMistakesCount = firstAnswerWordMistakesCount + part.count;
      }
    });

    correctAnswerWords.forEach(answerWord => {
      const diff = Diff.diffChars(word, answerWord, {ignoreCase: true});
      let localMistakesCount = 0;

      diff.forEach(part => {
        if (part.added || part.removed) {
          localMistakesCount = localMistakesCount + part.count;
        }
      });

      if (localMistakesCount <= firstAnswerWordMistakesCount) {
        correctAnswerWord = answerWord;
        firstAnswerWordMistakesCount = localMistakesCount;
      }
    });

    return correctAnswerWord;
  }

  getColorForWordCorrectness(correctness: number) {
    if (this.result.correctness === CORRECTNESS_INCORRECT) {
      return 'red';
    }

    if (this.result.correctness === CORRECTNESS_CORRECT_PARTIALLY) {
      return 'orange';
    }

    if (correctness === CORRECTNESS_CORRECT_FULLY) {
      return 'green';
    }
    if (correctness === CORRECTNESS_CORRECT_PARTIALLY) {
      return 'orange';
    }
    if (correctness === CORRECTNESS_INCORRECT) {
      return 'red';
    }
    if (correctness === CORRECTNESS_OVERRIDE) {
      return 'red';
    }
  }
}
