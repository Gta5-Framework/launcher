import { Card } from "../Card";
import styles from "./NewsList.module.css";

export interface NewsEntry {
  title: string;
  date: string;
  text: string;
}

export interface NewsListProps {
  eyebrow: string;
  items: NewsEntry[];
}

export function NewsList({ eyebrow, items }: NewsListProps) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.eyebrow}>{eyebrow}</span>

      <div className={styles.cards}>
        {items.map((item) => (
          <Card key={item.title} title={item.title} meta={item.date}>
            {item.text}
          </Card>
        ))}
      </div>
    </div>
  );
}
