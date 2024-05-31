#include <libtrie/trie.h>

#include <stdio.h>

int main(const int argc, const char *const argv[]) {
    Trie *t, *p;
    FILE *fp;
    int c;
    uint64_t sents;

    if (argc < 2) {
        fprintf(stderr, "Usage: echo ... | %s <model.bin>\n", argv[0]);
        return 1;
    }

    fp = fopen(argv[1], "rb");

    if (fp) {
        puts("Loading the old model...");

        t = trie_load_file(fp);
        fclose(fp);

        if (!t) {
            fputs("Failed to load tree\n", stderr);
            return 1;
        }
    } else {
        puts("Creating a new model...");

        t = trie_create_node('\0');

        if (!t) {
            fputs("Failed to create tree\n", stderr);
            return 1;
        }
    }

    puts("Updating the model...");

    p = t;
    sents = 0;

    while ((c = getchar()) != EOF)
        if ((p = trie_insert_character(p, (uint8_t)c))->c == '\0') {
            ++sents;
            p = t;
        }

    if (p->c != '\0')
        trie_insert_character(p, '\0');

    printf("Saved %lu sentences.\n", sents);

    puts("Saving the model...");

    fp = fopen(argv[1], "wb");

    if (!fp) {
        fputs("Failed to open the model file.\n", stderr);
        trie_free(t);
        return 1;
    }

    trie_save_file(fp, t);

    puts("Freeing resources...");

    fclose(fp);
    trie_free(t);

    return 0;
}
