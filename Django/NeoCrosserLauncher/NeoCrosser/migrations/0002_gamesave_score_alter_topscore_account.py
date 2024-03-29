# Generated by Django 4.0.1 on 2022-02-14 22:15

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('NeoCrosser', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='gamesave',
            name='score',
            field=models.IntegerField(default=201, verbose_name='Score'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='topscore',
            name='account',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='NeoCrosser.account'),
        ),
    ]
