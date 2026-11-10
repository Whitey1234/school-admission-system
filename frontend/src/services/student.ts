const STUDENT_KEY = "admission_student_id";

export function getStudentId(): string {
  let id = localStorage.getItem(STUDENT_KEY);

  if (!id) {
    id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      (character) => {
        const random = Math.floor(Math.random() * 16);

        const value =
          character === "x" ? random : (random & 0x3) | 0x8;

        return value.toString(16);
      }
    );

    localStorage.setItem(STUDENT_KEY, id);
  }

  return id;
}